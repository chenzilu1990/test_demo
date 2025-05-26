import { BaseProvider } from '../core/BaseProvider';
import { CompletionRequest, CompletionResponse, ChatMessage } from '../types';

export class SiliconFlowProvider extends BaseProvider {
  // 将OpenAI格式转换为SiliconFlow格式
  private mapToSiliconFlowFormat(request: CompletionRequest) {
    return {
      model: request.model,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: request.temperature,
      max_tokens: request.max_tokens || 2048,
      stream: request.stream,
      tools: request.tools,
      tool_choice: request.tool_choice,
    };
  }
  
  // 将SiliconFlow响应转换为OpenAI格式
  private mapToOpenAIFormat(response: any): CompletionResponse {
    return {
      id: response.id || `sf-${Date.now()}`,
      object: 'chat.completion',
      created: Date.now(),
      model: response.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: response.choices[0].message.content,
          },
          finish_reason: response.choices[0].finish_reason || 'stop',
        },
      ],
      usage: response.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }
  
  async chat(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.validateRequest(request)) {
      throw new Error(`Invalid request for model ${request.model}`);
    }
    
    const url = `${this.options.baseURL}/chat/completions`;
    const siliconFlowRequest = this.mapToSiliconFlowFormat(request);
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(siliconFlowRequest),
    });
    
    const data = await response.json();
    return this.mapToOpenAIFormat(data);
  }
  
  async *chatStream(request: CompletionRequest): AsyncIterable<any> {
    if (!this.validateRequest(request)) {
      throw new Error(`Invalid request for model ${request.model}`);
    }
    
    const url = `${this.options.baseURL}/chat/completions`;
    const siliconFlowRequest = this.mapToSiliconFlowFormat({
      ...request,
      stream: true,
    });
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(siliconFlowRequest),
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
          if (line.startsWith('data: [DONE]')) continue;
          
          if (line.startsWith('data:')) {
            const data = line.replace(/^data: /, '');
            try {
              const parsedData = JSON.parse(data);
              // 转换为OpenAI格式
              const openAIFormat = {
                id: parsedData.id || `sf-${Date.now()}`,
                object: 'chat.completion.chunk',
                created: Date.now(),
                model: request.model,
                choices: [
                  {
                    index: 0,
                    delta: {
                      content: parsedData.choices[0].delta.content || '',
                    },
                    finish_reason: parsedData.choices[0].finish_reason || null,
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

  // SiliconFlow特定的连接测试方法
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

      console.log(`Testing SiliconFlow connection with model ${testModel}...`);

      // SiliconFlow使用OpenAI兼容格式的测试请求
      const testRequest = {
        model: testModel,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 1,
        temperature: 0,
        stream: false
      };

      const url = `${this.options.baseURL}/chat/completions`;
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(testRequest),
      });

      const data = await response.json();
      
      // 检查OpenAI兼容的响应格式
      if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
        console.log(`✅ SiliconFlow连接测试成功`);
        return true;
      } else if (data.error) {
        throw new Error(data.error.message || 'SiliconFlow API返回错误');
      } else {
        throw new Error('SiliconFlow API返回了无效的响应格式');
      }
      
    } catch (error: any) {
      console.error(`❌ SiliconFlow连接测试失败:`, error.message);
      
      // SiliconFlow特定的错误消息处理
      let errorMessage = error.message;
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'SiliconFlow API密钥无效，请检查API密钥是否正确';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'SiliconFlow API密钥权限不足或账户余额不足，请检查账户状态';
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        errorMessage = 'SiliconFlow请求频率过高，请稍后再试或升级您的API计划';
      } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
        errorMessage = 'SiliconFlow请求格式错误，请检查API配置';
      } else if (error.message.includes('model') && error.message.includes('not found')) {
        errorMessage = `模型 ${model || this.config.models[0]?.id} 在SiliconFlow中不可用或已下线`;
      } else if (error.message.includes('Service Unavailable')) {
        errorMessage = 'SiliconFlow服务暂时不可用，请稍后重试';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'SiliconFlow连接超时，请检查网络连接';
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
        errorMessage = '无法连接到SiliconFlow服务，请检查网络连接';
      }
      
      throw new Error(errorMessage);
    }
  }
} 