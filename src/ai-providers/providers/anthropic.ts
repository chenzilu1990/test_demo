import { BaseProvider } from '../core/BaseProvider';
import { CompletionRequest, CompletionResponse, ChatMessage } from '../types';

export class AnthropicProvider extends BaseProvider {
  // 将OpenAI格式转换为Anthropic格式
  private mapToAnthropicFormat(request: CompletionRequest) {
    return {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens || 1024,
      stream: request.stream,
    };
  }
  
  // 将Anthropic响应转换为OpenAI格式
  private mapToOpenAIFormat(response: any): CompletionResponse {
    return {
      id: response.id,
      object: 'chat.completion',
      created: Date.now(),
      model: response.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: response.content[0].text,
          },
          finish_reason: response.stop_reason,
        },
      ],
      usage: response.usage,
    };
  }
  
  async chat(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.validateRequest(request)) {
      throw new Error(`Invalid request for model ${request.model}`);
    }
    
    const url = `${this.options.baseURL}/messages`;
    const anthropicRequest = this.mapToAnthropicFormat(request);
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(anthropicRequest),
    });
    
    const data = await response.json();
    return this.mapToOpenAIFormat(data);
  }
  
  async *chatStream(request: CompletionRequest): AsyncIterable<any> {
    if (!this.validateRequest(request)) {
      throw new Error(`Invalid request for model ${request.model}`);
    }
    
    const url = `${this.options.baseURL}/messages`;
    const anthropicRequest = this.mapToAnthropicFormat({
      ...request,
      stream: true,
    });
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(anthropicRequest),
    });
    
    if (!response.body) {
      throw new Error('Response body is null');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.trim() === 'event: done') continue;
          
          if (line.startsWith('data:')) {
            const data = line.replace(/^data: /, '');
            try {
              const parsedData = JSON.parse(data);
              // 转换为OpenAI格式
              const openAIFormat = {
                id: parsedData.id,
                object: 'chat.completion.chunk',
                created: Date.now(),
                model: request.model,
                choices: [
                  {
                    index: 0,
                    delta: {
                      content: parsedData.delta?.text || '',
                    },
                    finish_reason: parsedData.delta?.stop_reason,
                  },
                ],
              };
              yield openAIFormat;
            } catch (e) {
              console.warn('Could not parse stream message', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Anthropic特定的连接测试方法
  public async testConnection(model?: string): Promise<boolean> {
    try {
      // 检查API密钥
      if (!this.options.apiKey) {
        throw new Error('API密钥未配置');
      }

      // 使用指定模型或第一个可用模型
      const testModel = model || this.config.models[0]?.id;
      if (!testModel) {
        throw new Error('未找到可用的模型进行测试');
      }

      console.log(`Testing Anthropic connection with model ${testModel}...`);

      // Anthropic格式的测试请求
      const testRequest = {
        model: testModel,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 1,
        temperature: 0
      };

      const url = `${this.options.baseURL}/messages`;
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(testRequest),
      });

      const data = await response.json();
      
      // 检查Anthropic响应格式
      if (data.content && Array.isArray(data.content) && data.content.length > 0) {
        console.log(`✅ Anthropic连接测试成功`);
        return true;
      } else if (data.error) {
        throw new Error(data.error.message || 'Anthropic API返回错误');
      } else {
        throw new Error('Anthropic API返回了无效的响应格式');
      }
      
    } catch (error: any) {
      console.error(`❌ Anthropic连接测试失败:`, error.message);
      
      // Anthropic特定的错误消息处理
      let errorMessage = error.message;
      
      if (error.message.includes('401') || error.message.includes('authentication_error')) {
        errorMessage = 'Anthropic API密钥无效，请检查API密钥是否正确';
      } else if (error.message.includes('403') || error.message.includes('permission_error')) {
        errorMessage = 'Anthropic API密钥权限不足，请检查API密钥权限设置';
      } else if (error.message.includes('429') || error.message.includes('rate_limit_error')) {
        errorMessage = 'Anthropic请求频率过高，请稍后再试或升级您的API计划';
      } else if (error.message.includes('400') || error.message.includes('invalid_request_error')) {
        errorMessage = 'Anthropic请求格式错误，请检查API配置';
      } else if (error.message.includes('model') && error.message.includes('not found')) {
        errorMessage = `模型 ${model || this.config.models[0]?.id} 在Anthropic中不可用`;
      } else if (error.message.includes('overloaded_error')) {
        errorMessage = 'Anthropic服务负载过高，请稍后重试';
      } else if (error.message.includes('api_error')) {
        errorMessage = 'Anthropic API服务错误，请稍后重试';
      }
      
      throw new Error(errorMessage);
    }
  }

  protected buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...this.options.headers,
    };
    
    if (this.options.apiKey && this.config.authType === 'key') {
      headers['x-api-key'] = `${this.options.apiKey}`;
    }
    console.log(headers);
    return headers;
  }

}
