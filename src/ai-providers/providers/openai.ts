import { BaseProvider, ErrorCode, ProviderError } from '../core/BaseProvider';
import { CompletionRequest, CompletionResponse, ImageGenerationRequest, ImageGenerationResponse } from '../types';

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

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.validateImageRequest(request)) {
      throw new Error(`Invalid image generation request for model ${request.model}`);
    }
    
    const url = `${this.options.baseURL}/images/generations`;
    
    const body: any = {
      model: request.model,
      prompt: request.prompt,
      n: request.n || 1,
      size: request.size || '1024x1024',
    };

      // DALL-E 2 specific parameters
    if (request.model === 'dall-e-2') {
      body.response_format = request.response_format || 'url';
    }
    // DALL-E 3 specific parameters
    if (request.model === 'dall-e-3') {
      body.quality = request.quality || 'standard';
      body.style = request.style || 'vivid';
      body.response_format = request.response_format || 'url';
    }

    
    console.log('[AI_PROVIDER_DEBUG] OpenAI Image Generation Request Body:', body);
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return data as ImageGenerationResponse;
  }

  // 扩展验证方法以支持图像生成请求
  protected validateImageRequest(request: ImageGenerationRequest): boolean {
    if (!request.prompt || !request.model) {
      return false;
    }

    // 验证模型是否为 DALL-E 模型
    const model = this.getModelById(request.model);
    if (!model ) {
      return false;
    }

    // 验证可选参数
    if (request.n && (request.n < 1 || request.n > 10)) {
      return false;
    }

    if (request.size && !['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024'].includes(request.size)) {
      return false;
    }

    if (request.quality && !['standard', 'hd'].includes(request.quality)) {
      return false;
    }

    if (request.style && !['vivid', 'natural'].includes(request.style)) {
      return false;
    }

    if (request.response_format && !['url', 'b64_json'].includes(request.response_format)) {
      return false;
    }

    return true;
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
        // 使用 parseError 处理错误
        throw this.parseError({ message: data.error.message, details: data.error, status: response.status });
      } else {
        throw new ProviderError('OpenAI API返回了无效的响应格式', ErrorCode.INTERNAL_ERROR, response.status, this.id, data);
      }
      
    } catch (error: any) {
      console.error(`❌ OpenAI连接测试失败:`, error.message);
      // 抛出由 parseError 处理过的错误
      throw this.parseError(error);
    }
  }

  // 新增：覆盖基类的 parseError 方法以处理 OpenAI 特定的错误
  protected parseError(error: any): ProviderError {
    const message = error.message || error.toString();
    const status = error.status || error.response?.status;
    let details = error.details;

    // 尝试从 error.response 或 error 本身解析 details (如果 fetchWithRetry 中已解析)
    if (error.response && typeof error.response === 'object' && error.response.data && typeof error.response.data.error === 'object') {
        details = error.response.data.error;
    } else if (error.error && typeof error.error === 'object') { // 处理 fetchWithRetry 中已经解析并传递的 error.error
        details = error.error;
    }


    if (details && typeof details === 'object') {
      const openAICode = details.code;
      // 如果 details 中有 message，优先使用，否则使用外部传入的 message
      const openAIMessage = details.message || message; 
      const openAIType = details.type;

      if (openAICode === 'insufficient_quota') {
        return new ProviderError(
          `账户配额不足: ${openAIMessage} 请检查您的 OpenAI 账户余额或升级计划。`,
          ErrorCode.INSUFFICIENT_QUOTA,
          status || 429,
          this.id,
          details
        );
      }
      if (openAICode === 'invalid_api_key' || status === 401) {
        return new ProviderError(
          `API密钥无效或已过期: ${openAIMessage} 请检查您的 OpenAI API 密钥是否正确。`,
          ErrorCode.UNAUTHORIZED,
          401,
          this.id,
          details
        );
      }
      if (openAIType === 'billing_not_active' || openAICode === 'billing_not_active') { // 兼容两种可能的错误标识
        return new ProviderError(
          `账户账单未激活: ${openAIMessage} 请检查您的 OpenAI 账户支付设置。`,
          ErrorCode.FORBIDDEN,
          status || 403,
          this.id,
          details
        );
      }
      if (openAICode === 'model_not_found') {
        return new ProviderError(
          `模型未找到: ${openAIMessage}`,
          ErrorCode.MODEL_NOT_FOUND,
          status || 404,
          this.id,
          details
        );
      }
      if (openAICode === 'billing_hard_limit_reached') {
        return new ProviderError(
          `账户余额不足 (硬限制): ${openAIMessage} 请检查您的 OpenAI 账户余额或升级计划。`,
          ErrorCode.INSUFFICIENT_QUOTA,
          status || 429,
          this.id,
          details
        );
      }
      // 根据 OpenAI 文档，image_generation_user_error 也是一种需要用户关注的错误
      if (openAIType === 'image_generation_user_error') {
        return new ProviderError(
          `图像生成用户错误: ${openAIMessage || '请检查请求参数或账户状态。'} 可参考文档: https://docs.aihubmix.com/cn/api/GPT-Image-1`,
          ErrorCode.BAD_REQUEST, // 或者一个更具体的错误码
          status || 400,
          this.id,
          details
        );
      }
      // 如果有 openAIMessage，且不同于原始 message，使用它 (通常意味着 details 中有更具体的信息)
      if (openAIMessage && openAIMessage !== message) {
        return new ProviderError(openAIMessage, ErrorCode.UNKNOWN, status, this.id, details);
      }
    }
    
    // 如果不是 OpenAI 特定的错误，或者 details 中没有提供足够的信息，则调用基类的解析器
    return super.parseError(error);
  }


}
