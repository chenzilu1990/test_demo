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
} 