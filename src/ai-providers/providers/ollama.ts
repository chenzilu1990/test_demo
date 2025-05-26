import { BaseProvider } from '../core/BaseProvider';
import { CompletionRequest, CompletionResponse } from '../types';

export class OllamaProvider extends BaseProvider {
  // 将OpenAI格式转换为Ollama格式
  private mapToOllamaFormat(request: CompletionRequest) {
    // Ollama使用简单的消息格式
    return {
      model: request.model,
      messages: request.messages,
      options: {
        temperature: request.temperature,
        top_p: request.top_p,
        num_predict: request.max_tokens,
      },
      stream: !!request.stream,
    };
  }

  // 将Ollama响应转换为OpenAI格式
  private mapToOpenAIFormat(response: any): CompletionResponse {
    return {
      id: `ollama-${Date.now()}`,
      object: 'chat.completion',
      created: Date.now(),
      model: response.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: response.message?.content || '',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: response.prompt_eval_count || 0,
        completion_tokens: response.eval_count || 0,
        total_tokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
    };
  }

  async chat(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.validateRequest(request)) {
      throw new Error(`Invalid request for model ${request.model}`);
    }
    
    const url = `${this.options.baseURL}/chat`;
    const ollamaRequest = this.mapToOllamaFormat({...request, stream: false});
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(ollamaRequest),
    });
    
    const data = await response.json();
    return this.mapToOpenAIFormat(data);
  }
  
  async *chatStream(request: CompletionRequest): AsyncIterable<any> {
    if (!this.validateRequest(request)) {
      throw new Error(`Invalid request for model ${request.model}`);
    }
    
    const url = `${this.options.baseURL}/chat`;
    const ollamaRequest = this.mapToOllamaFormat({...request, stream: true});
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(ollamaRequest),
    });
    
    if (!response.body) {
      throw new Error('Response body is null');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let responseText = '';
    
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
          
          try {
            const parsedData = JSON.parse(line);
            responseText += parsedData.message?.content || '';
            
            // 转换为OpenAI格式
            const openAIFormat = {
              id: `ollama-stream-${Date.now()}`,
              object: 'chat.completion.chunk',
              created: Date.now(),
              model: request.model,
              choices: [
                {
                  index: 0,
                  delta: {
                    content: parsedData.message?.content || '',
                  },
                  finish_reason: parsedData.done ? 'stop' : null,
                },
              ],
            };
            
            yield openAIFormat;
          } catch (e) {
            console.warn('Could not parse stream message', line);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Ollama特定的连接测试方法
  public async testConnection(model?: string): Promise<boolean> {
    try {
      // Ollama不需要API密钥，但需要检查服务是否运行
      const testModel = model || this.config.models[0]?.id;
      if (!testModel) {
        throw new Error('未找到可用的模型进行测试');
      }

      console.log(`Testing Ollama connection with model ${testModel}...`);

      // 首先检查Ollama服务是否运行
      try {
        const healthUrl = `${this.options.baseURL}/api/tags`;
        const healthResponse = await this.fetchWithRetry(healthUrl, {
          method: 'GET',
          headers: this.buildHeaders(),
        });
        
        const availableModels = await healthResponse.json();
        console.log(`Ollama service is running, available models:`, availableModels.models?.map((m: any) => m.name) || []);
        
        // 检查指定模型是否可用
        const modelExists = availableModels.models?.some((m: any) => m.name === testModel);
        if (!modelExists) {
          throw new Error(`模型 ${testModel} 未在Ollama中安装，请先运行: ollama pull ${testModel}`);
        }
        
      } catch (error: any) {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
          throw new Error('无法连接到Ollama服务，请确保Ollama服务正在运行 (运行 ollama serve)');
        }
        throw error;
      }

      // 发送简单的测试请求
      const testRequest = {
        model: testModel,
        messages: [{ role: 'user', content: 'Hello' }],
        options: {
          temperature: 0,
          num_predict: 1,
        },
        stream: false,
      };

      const chatUrl = `${this.options.baseURL}/chat`;
      const response = await this.fetchWithRetry(chatUrl, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(testRequest),
      });

      const data = await response.json();
      
      // 检查响应是否有效
      if (data.message && typeof data.message.content === 'string') {
        console.log(`✅ Ollama连接测试成功`);
        return true;
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Ollama返回了无效的响应格式');
      }
      
    } catch (error: any) {
      console.error(`❌ Ollama连接测试失败:`, error.message);
      
      // Ollama特定的错误消息处理
      let errorMessage = error.message;
      
      if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Ollama服务未运行，请启动Ollama服务 (ollama serve)';
      } else if (error.message.includes('model') && error.message.includes('not found')) {
        errorMessage = `模型 ${model || this.config.models[0]?.id} 未安装，请运行: ollama pull ${model || this.config.models[0]?.id}`;
      } else if (error.message.includes('未在Ollama中安装')) {
        errorMessage = error.message; // 保持原有的详细错误信息
      } else if (error.message.includes('timeout')) {
        errorMessage = '请求超时，模型可能正在加载中，请稍后重试';
      }
      
      throw new Error(errorMessage);
    }
  }

  // Ollama不需要特殊的认证header
  protected buildHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...this.options.headers,
    };
  }
} 