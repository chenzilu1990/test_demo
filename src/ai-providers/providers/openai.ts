import { BaseProvider } from '../core/BaseProvider';
import { CompletionRequest, CompletionResponse } from '../types';

export class OpenAIProvider extends BaseProvider {
  async chat(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.validateRequest(request)) {
      throw new Error(`Invalid request for model ${request.model}`);
    }
    
    const url = `${this.options.baseURL}/chat/completions`;
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        top_p: request.top_p,
        max_tokens: request.max_tokens,
        stream: false,
        tools: request.tools,
        tool_choice: request.tool_choice,
      }),
    });
    
    const data = await response.json();
    return data as CompletionResponse;
  }
  
  async *chatStream(request: CompletionRequest): AsyncIterable<any> {
    if (!this.validateRequest(request)) {
      throw new Error(`Invalid request for model ${request.model}`);
    }
    
    const url = `${this.options.baseURL}/chat/completions`;
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        top_p: request.top_p,
        max_tokens: request.max_tokens,
        stream: true,
        tools: request.tools,
        tool_choice: request.tool_choice,
      }),
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
          if (line.trim() === 'data: [DONE]') continue;
          
          const message = line.replace(/^data: /, '');
          try {
            const parsedMessage = JSON.parse(message);
            yield parsedMessage;
          } catch (e) {
            console.warn('Could not parse stream message', message);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // OpenAI特定的连接测试方法
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

      console.log(`Testing OpenAI connection with model ${testModel}...`);

      // 标准OpenAI格式的测试请求
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
      
      // 检查标准OpenAI响应格式
      if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
        console.log(`✅ OpenAI连接测试成功`);
        return true;
      } else if (data.error) {
        throw new Error(data.error.message || 'OpenAI API返回错误');
      } else {
        throw new Error('OpenAI API返回了无效的响应格式');
      }
      
    } catch (error: any) {
      console.error(`❌ OpenAI连接测试失败:`, error.message);
      
      // OpenAI特定的错误消息处理
      let errorMessage = error.message;
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'OpenAI API密钥无效，请检查API密钥是否正确';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'OpenAI API密钥权限不足或账户余额不足，请检查账户状态';
      } else if (error.message.includes('429') || error.message.includes('rate_limit_exceeded')) {
        errorMessage = 'OpenAI请求频率过高，请稍后再试或升级您的API计划';
      } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
        errorMessage = 'OpenAI请求格式错误，请检查API配置';
      } else if (error.message.includes('model') && (error.message.includes('not found') || error.message.includes('does not exist'))) {
        errorMessage = `模型 ${model || this.config.models[0]?.id} 在OpenAI中不可用或不存在`;
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'OpenAI账户配额不足，请检查账户余额或升级计划';
      } else if (error.message.includes('Service Unavailable') || error.message.includes('502') || error.message.includes('503')) {
        errorMessage = 'OpenAI服务暂时不可用，请稍后重试';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'OpenAI连接超时，请检查网络连接或尝试使用代理';
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
        errorMessage = '无法连接到OpenAI服务，请检查网络连接或防火墙设置';
      }
      
      throw new Error(errorMessage);
    }
  }
}
