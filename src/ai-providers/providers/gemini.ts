import { BaseProvider } from '../core/BaseProvider';
import { CompletionRequest, CompletionResponse, ChatMessage } from '../types';

export class GeminiProvider extends BaseProvider {
  // 将OpenAI格式转换为Gemini格式
  private mapToGeminiFormat(request: CompletionRequest) {
    // 在Gemini中，没有system role，需要将system转为user
    const messages = request.messages.map(msg => {
      if (msg.role === 'system') {
        return { role: 'user', content: msg.content };
      }
      return msg;
    });

    return {
      contents: messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
      })),
      generationConfig: {
        temperature: request.temperature,
        topP: request.top_p,
        maxOutputTokens: request.max_tokens,
      },
      safetySettings: [],
    };
  }

  // 将Gemini响应转换为OpenAI格式
  private mapToOpenAIFormat(response: any): CompletionResponse {
    return {
      id: `gemini-${Date.now()}`,
      object: 'chat.completion',
      created: Date.now(),
      model: response.usageMetadata?.promptTokenCount || 'gemini',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: response.candidates[0]?.content?.parts[0]?.text || '',
          },
          finish_reason: response.candidates[0]?.finishReason || 'stop',
        },
      ],
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: 
          (response.usageMetadata?.promptTokenCount || 0) + 
          (response.usageMetadata?.candidatesTokenCount || 0),
      },
    };
  }

  async chat(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.validateRequest(request)) {
      throw new Error(`Invalid request for model ${request.model}`);
    }
    
    const url = `${this.options.baseURL}/${this.options.apiVersion || 'v1'}/models/${request.model}:generateContent`;
    const geminiRequest = this.mapToGeminiFormat(request);
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(geminiRequest),
    });
    
    const data = await response.json();
    return this.mapToOpenAIFormat(data);
  }
  
  async *chatStream(request: CompletionRequest): AsyncIterable<any> {
    if (!this.validateRequest(request)) {
      throw new Error(`Invalid request for model ${request.model}`);
    }
    
    const url = `${this.options.baseURL}/${this.options.apiVersion || 'v1'}/models/${request.model}:streamGenerateContent`;
    const geminiRequest = this.mapToGeminiFormat(request);
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(geminiRequest),
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
          
          try {
            const parsedData = JSON.parse(line);
            
            // 转换为OpenAI格式
            const openAIFormat = {
              id: `gemini-stream-${Date.now()}`,
              object: 'chat.completion.chunk',
              created: Date.now(),
              model: request.model,
              choices: [
                {
                  index: 0,
                  delta: {
                    content: parsedData.candidates?.[0]?.content?.parts?.[0]?.text || '',
                  },
                  finish_reason: parsedData.candidates?.[0]?.finishReason || null,
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

  // Gemini API需要特殊的header处理
  protected buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...this.options.headers,
    };
    
    if (this.options.apiKey) {
      headers['x-goog-api-key'] = this.options.apiKey;
    }
    
    return headers;
  }

  // Gemini特定的连接测试方法
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

      // 构建Gemini特定的测试请求URL
      const url = `${this.options.baseURL}/${this.options.apiVersion || 'v1'}/models/${testModel}:generateContent`;
      
      // Gemini格式的测试请求
      const testRequest = {
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }]
          }
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1,
        },
        safetySettings: [],
      };

      console.log(`Testing Gemini connection with model ${testModel}...`);

      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(testRequest),
      });

      const data = await response.json();
      
      // 检查响应是否有效
      if (data.candidates && data.candidates.length > 0) {
        console.log(`✅ Gemini连接测试成功`);
        return true;
      } else if (data.error) {
        throw new Error(data.error.message || 'Gemini API返回错误');
      } else {
        throw new Error('Gemini API返回了无效的响应格式');
      }
      
    } catch (error: any) {
      console.error(`❌ Gemini连接测试失败:`, error.message);
      
      // Gemini特定的错误消息处理
      let errorMessage = error.message;
      
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid API key')) {
        errorMessage = 'Gemini API密钥无效，请在Google AI Studio获取有效的API密钥';
      } else if (error.message.includes('PERMISSION_DENIED')) {
        errorMessage = 'API密钥权限不足，请检查API密钥权限设置';
      } else if (error.message.includes('QUOTA_EXCEEDED')) {
        errorMessage = 'API配额已用完，请检查您的使用限制或升级计划';
      } else if (error.message.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = '请求频率过高，请稍后重试';
      } else if (error.message.includes('MODEL_NOT_FOUND')) {
        errorMessage = `模型 ${model || this.config.models[0]?.id} 不存在或不可用`;
      }
      
      throw new Error(errorMessage);
    }
  }
} 