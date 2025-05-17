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
}
