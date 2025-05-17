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
} 