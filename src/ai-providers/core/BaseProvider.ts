import { AIProvider, ProviderConfig, ModelCard, CompletionRequest, CompletionResponse, ProviderOptions } from '../types';

export abstract class BaseProvider implements AIProvider {
  public id: string;
  public config: ProviderConfig;
  protected options: ProviderOptions;

  constructor(config: ProviderConfig, options: ProviderOptions = {}) {
    this.id = config.id;
    this.config = config;
    this.options = {
      baseURL: options.baseURL || config.baseURL,
      apiKey: options.apiKey,
      apiVersion: options.apiVersion || config.apiVersion,
      proxy: options.proxy,
      timeout: options.timeout || 30000,
      headers: {
        ...config.defaultHeaders,
        ...options.headers,
      },
      fetch: options.fetch || globalThis.fetch,
    };
  }

  abstract chat(request: CompletionRequest): Promise<CompletionResponse>;
  abstract chatStream(request: CompletionRequest): AsyncIterable<any>;

  public getModels(): Promise<ModelCard[]> {
    return Promise.resolve(this.config.models);
  }

  public getModelById(modelId: string): ModelCard | undefined {
    console.log(this.config.models);
    return this.config.models.find(model => model.id === modelId);
  }

  public validateRequest(request: CompletionRequest): boolean {
    const model = this.getModelById(request.model);
    if (!model) {
      console.error(`模型不存在 [${this.id}]: ${request.model}`);
      return false;
    }
    
    if (request.tools && request.tools.length > 0 && !model.capabilities.functionCall) {
      console.error(`模型不支持工具调用 [${this.id}]: ${request.model}`);
      return false;
    }
    
    if (request.temperature && model.maxTemperature && request.temperature > model.maxTemperature) {
      console.error(`温度超出范围 [${this.id}]: ${request.model}`);
      return false;
    }

    return true;
  }

  // 通用测试连接方法 - 子类可以重写以实现特定的测试逻辑
  public async testConnection(model?: string): Promise<boolean> {
    try {
      // 检查API密钥
      if (!this.options.apiKey && this.config.authType === 'key') {
        throw new Error('API密钥未配置');
      }

      // 使用指定模型或第一个可用模型
      const testModel = model || this.config.models[0]?.id;
      if (!testModel) {
        throw new Error('未找到可用的模型进行测试');
      }

      // 发送简单的测试请求
      const testRequest: CompletionRequest = {
        messages: [{ role: 'user', content: 'test' }],
        model: testModel,
        max_tokens: 1,
        temperature: 0
      };

      // 调用chat方法进行测试
      const response = await this.chat(testRequest);
      return response && response.choices && response.choices.length > 0;
      
    } catch (error: any) {
      console.error(`连接测试失败 [${this.id}]:`, error.message);
      
      // 重新抛出错误，让调用者能够获取具体的失败原因
      if (error.message) {
        throw new Error(this.getDetailedErrorMessage(error));
      }
      throw error;
    }
  }

  // 获取详细的错误消息
  protected getDetailedErrorMessage(error: any): string {
    const message = error.message || error.toString();
    
    // 常见错误类型的处理
    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'API密钥无效或已过期，请检查密钥是否正确';
    }
    
    if (message.includes('403') || message.includes('Forbidden')) {
      return 'API密钥权限不足或账户余额不足，请检查账户状态';
    }
    
    if (message.includes('429') || message.includes('rate limit')) {
      return '请求频率过高，请稍后再试或升级您的API计划';
    }
    
    if (message.includes('timeout') || message.includes('TIMEOUT')) {
      return '连接超时，请检查网络连接或尝试使用代理';
    }
    
    if (message.includes('ENOTFOUND') || message.includes('network') || message.includes('DNS')) {
      return '网络连接失败，请检查网络设置或防火墙配置';
    }
    
    if (message.includes('Invalid request') || message.includes('Bad Request')) {
      return '请求格式错误，请检查API配置是否正确';
    }
    
    if (message.includes('Service Unavailable') || message.includes('502') || message.includes('503')) {
      return '服务暂时不可用，请稍后重试';
    }
    
    if (message.includes('Internal Server Error') || message.includes('500')) {
      return '服务器内部错误，请稍后重试';
    }

    if (message.includes('model') && message.includes('not found')) {
      return '指定的模型不存在或不可用，请检查模型名称';
    }

    // 返回原始错误消息
    return message;
  }

  protected buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...this.options.headers,
    };
    
    if (this.options.apiKey && this.config.authType === 'key') {
      headers['Authorization'] = `Bearer ${this.options.apiKey}`;
    }
    console.log(headers);
    return headers;
  }

  protected async fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
    const fetch = this.options.fetch || globalThis.fetch;
    
    let lastError: Error;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: this.buildHeaders(),
          signal: options.signal,
        });
        
        if (response.ok) {
          return response;
        }
        
        if (response.status === 429) {
          // Rate limit - wait and retry
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000 * (i + 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } 
        else if (response.status === 404) {
          throw new Error('API地址不存在，请检查API地址是否正确');
        }
        
        throw new Error(`Request failed with status ${response.status}: ${await response.text()}`);
      } catch (err) {
        lastError = err as Error;
        if (i === retries - 1) {
          throw lastError;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
    
    throw lastError!;
  }
}
