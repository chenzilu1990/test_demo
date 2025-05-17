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
} 