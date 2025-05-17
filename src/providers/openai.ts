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
}
