import { AIProvider, ProviderConfig, ModelCard, CompletionRequest, CompletionResponse, ProviderOptions, AIProviderError } from '../types';
import { ValidationUtils } from './validation';

// 添加错误代码枚举
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  INSUFFICIENT_QUOTA = 'INSUFFICIENT_QUOTA',
  API_KEY_MISSING = 'API_KEY_MISSING',
  UNKNOWN = 'UNKNOWN'
}

// 创建自定义错误类
export class ProviderError extends Error implements AIProviderError {
  code: string;
  status?: number;
  provider?: string;
  details?: any;

  constructor(message: string, code: string = ErrorCode.UNKNOWN, status?: number, provider?: string, details?: any) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.status = status;
    this.provider = provider;
    this.details = details;
  }
}

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
    return this.config.models.find(model => model.id === modelId);
  }

  public validateRequest(request: CompletionRequest): boolean {
    const model = this.getModelById(request.model);
    const errors = ValidationUtils.validateRequestParams(request, model);
    
    if (errors.length > 0) {
      console.error(`请求验证失败 [${this.id}]:`, errors.join(', '));
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
    
    // 解析错误并返回ProviderError
    const errorInfo = this.parseError(error);
    return errorInfo.message;
  }

  // 新增：解析错误并返回结构化的错误信息
  protected parseError(error: any): ProviderError {
    const message = error.message || error.toString();
    const status = error.status || error.response?.status;
    const details = error.details;

    // 常见错误类型的处理 (如果上面没有匹配到 OpenAI 特定错误)
    if (status === 401 || message.includes('401') || message.includes('Unauthorized')) {
      return new ProviderError(
        'API密钥无效或已过期，请检查密钥是否正确',
        ErrorCode.UNAUTHORIZED,
        401,
        this.id
      );
    }
    
    if (status === 403 || message.includes('403') || message.includes('Forbidden')) {
      return new ProviderError(
        'API密钥权限不足或账户余额不足，请检查账户状态',
        ErrorCode.FORBIDDEN,
        403,
        this.id
      );
    }
    
    if (status === 429 || message.includes('429') || message.includes('rate limit')) {
      return new ProviderError(
        '请求频率过高，请稍后再试或升级您的API计划',
        ErrorCode.RATE_LIMIT,
        429,
        this.id
      );
    }
    
    if (message.includes('timeout') || message.includes('TIMEOUT')) {
      return new ProviderError(
        '连接超时，请检查网络连接或尝试使用代理',
        ErrorCode.TIMEOUT,
        undefined,
        this.id
      );
    }
    
    if (message.includes('ENOTFOUND') || message.includes('network') || message.includes('DNS')) {
      return new ProviderError(
        '网络连接失败，请检查网络设置或防火墙配置',
        ErrorCode.NETWORK_ERROR,
        undefined,
        this.id
      );
    }
    
    if (status === 400 || message.includes('Invalid request') || message.includes('Bad Request')) {
      return new ProviderError(
        '请求格式错误，请检查API配置是否正确 $',
        ErrorCode.BAD_REQUEST,
        400,
        this.id
      );
    }
    
    if (status === 503 || status === 502 || message.includes('Service Unavailable') || message.includes('502') || message.includes('503')) {
      return new ProviderError(
        '服务暂时不可用，请稍后重试',
        ErrorCode.SERVICE_UNAVAILABLE,
        status || 503,
        this.id
      );
    }
    
    if (status === 500 || message.includes('Internal Server Error') || message.includes('500')) {
      return new ProviderError(
        '服务器内部错误，请稍后重试',
        ErrorCode.INTERNAL_ERROR,
        500,
        this.id
      );
    }

    if (message.includes('insufficient_quota')) {
      return new ProviderError(
        '账户配额不足，请检查账户余额或升级计划',
        ErrorCode.INSUFFICIENT_QUOTA,
        status || 402, // 通常 OpenAI 返回 429 for quota
        this.id
      );
    }

    // 返回原始错误消息
    return new ProviderError(message, ErrorCode.UNKNOWN, status, this.id, error);
  }

  protected buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...this.options.headers,
    };
    
    if (this.options.apiKey && this.config.authType === 'key') {
      headers['Authorization'] = `Bearer ${this.options.apiKey}`;
    }
    return headers;
  }

  protected async fetchWithRetry(url: string, options: RequestInit, retries?: number): Promise<Response> {
    const fetch = this.options.fetch || globalThis.fetch;
    const maxRetries = retries ?? this.options.retry?.maxRetries ?? 3;
    const retryDelay = this.options.retry?.retryDelay ?? 1000;
    const retryOn = this.options.retry?.retryOn ?? [429, 502, 503, 504];
    const exponentialBackoff = this.options.retry?.exponentialBackoff ?? true;
    
    let lastError: Error = new ProviderError(
      'All fetch attempts failed or an unexpected error occurred during retries.',
      ErrorCode.UNKNOWN,
      undefined,
      this.id
    );

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: this.buildHeaders(),
          signal: options.signal,
        });
        
        if (response.ok) {
          return response;
        }

        // 如果是最后一次尝试，并且响应仍然是不可接受的，则立即处理并抛出这个错误
        if (i === maxRetries - 1 && !response.ok) {
          const errorText = await response.text();
          let errorDetails: any = { response: errorText };
          let errorMessage = `请求失败 (最后一次尝试): ${errorText}`;
          try {
            const parsedError = JSON.parse(errorText);
            if (parsedError && parsedError.error) {
              errorDetails = parsedError.error;
              errorMessage = `请求失败 (最后一次尝试): ${parsedError.error.message || errorText}`;
            }
          } catch (e) { /* JSON 解析失败 */ }
          // 使用 parseError 来确保错误代码和消息的一致性
          throw this.parseError(new ProviderError(errorMessage, ErrorCode.UNKNOWN, response.status, this.id, errorDetails));
        }
        
        // 检查是否应该重试
        if (retryOn.includes(response.status)) {
          // Rate limit - 使用服务器提供的重试延迟
          console.log('[AI_PROVIDER_DEBUG] Rate limit - 使用服务器提供的重试延迟');
          
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
            const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 
                         exponentialBackoff ? retryDelay * Math.pow(2, i) : retryDelay;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // 其他可重试的错误
          const delay = exponentialBackoff ? retryDelay * Math.pow(2, i) : retryDelay;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } 
        
        // 不可重试的错误
        if (response.status === 404) {
          throw new ProviderError(
            'API地址不存在，请检查API地址是否正确',
            ErrorCode.BAD_REQUEST,
            404,
            this.id
          );
        }
        
        const errorText = await response.text();
        let errorDetails: any = { response: errorText };
        let errorMessage = `请求失败: ${errorText}`;

        try {
          const parsedError = JSON.parse(errorText);
          if (parsedError && parsedError.error) {
            errorDetails = parsedError.error; // 将 OpenAI 的 error 对象作为 details
            // 优先使用 parsedError.error.message 如果存在
            errorMessage = `请求失败: ${parsedError.error.message || errorText}`;
            // 如果有 OpenAI 的 code，可以考虑用它来构造更具体的 ProviderError code
            // 例如: const errorCode = this.mapOpenAICodeToErrorCode(parsedError.error.code);
          }
        } catch (e) {
          // JSON 解析失败，保持原有行为
        }

        throw new ProviderError(
          errorMessage,
          ErrorCode.UNKNOWN, // 稍后可以根据 parsedError.error.code 映射到更具体的 ErrorCode
          response.status,
          this.id,
          errorDetails
        );
      } catch (err) {
        lastError = err as Error;
        
        // 如果是最后一次重试 (通常是网络错误或 fetch 本身抛出的错误)，通过 parseError 处理
        if (i === maxRetries - 1) {
          throw this.parseError(lastError); 
        }
        
        // 网络错误也需要重试
        const delay = exponentialBackoff ? retryDelay * Math.pow(2, i) : retryDelay;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }


}
