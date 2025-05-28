import { CompletionRequest, ModelCard } from '../types';

export class ValidationUtils {
  /**
   * 验证API密钥格式
   */
  static validateApiKey(apiKey: string | undefined, provider: string): boolean {
    if (!apiKey) return false;
    
    switch (provider) {
      case 'openai':
        // OpenAI密钥格式: sk-...
        return /^sk-[a-zA-Z0-9]{32,}$/.test(apiKey);
      
      case 'anthropic':
        // Anthropic密钥格式
        return apiKey.length > 20;
      
      case 'gemini':
        // Gemini密钥格式
        return apiKey.length > 20;
      
      case 'siliconflow':
      case 'aihubmix':
        // 通用密钥格式验证
        return apiKey.length > 10;
      
      case 'ollama':
        // Ollama不需要密钥
        return true;
      
      default:
        return apiKey.length > 0;
    }
  }

  /**
   * 验证URL格式
   */
  static validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证请求参数
   */
  static validateRequestParams(request: CompletionRequest, model: ModelCard | undefined): string[] {
    const errors: string[] = [];

    // 验证消息
    if (!request.messages || request.messages.length === 0) {
      errors.push('消息列表不能为空');
    }

    // 验证模型
    if (!request.model) {
      errors.push('必须指定模型');
    }

    if (!model) {
      errors.push(`模型 ${request.model} 不存在`);
      return errors;
    }

    // 验证温度参数
    if (request.temperature !== undefined) {
      if (request.temperature < 0) {
        errors.push('温度参数不能小于0');
      }
      if (model.maxTemperature && request.temperature > model.maxTemperature) {
        errors.push(`温度参数不能大于 ${model.maxTemperature}`);
      }
    }

    // 验证top_p参数
    if (request.top_p !== undefined) {
      if (request.top_p < 0 || request.top_p > 1) {
        errors.push('top_p参数必须在0到1之间');
      }
    }

    // 验证max_tokens
    if (request.max_tokens !== undefined && request.max_tokens <= 0) {
      errors.push('max_tokens必须大于0');
    }

    // 验证工具调用
    if (request.tools && request.tools.length > 0 && !model.capabilities.functionCall) {
      errors.push(`模型 ${model.name} 不支持工具调用`);
    }

    // 验证视觉输入
    const hasImageContent = request.messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(c => c.type === 'image' || c.type === 'image_url')
    );
    
    if (hasImageContent && !model.capabilities.vision) {
      errors.push(`模型 ${model.name} 不支持图像输入`);
    }

    return errors;
  }

  /**
   * 清理和规范化请求参数
   */
  static normalizeRequest(request: CompletionRequest): CompletionRequest {
    const normalized = { ...request };

    // 确保温度在合理范围内
    if (normalized.temperature !== undefined) {
      normalized.temperature = Math.max(0, normalized.temperature);
    }

    // 确保top_p在合理范围内
    if (normalized.top_p !== undefined) {
      normalized.top_p = Math.max(0, Math.min(1, normalized.top_p));
    }

    // 确保max_tokens为正数
    if (normalized.max_tokens !== undefined) {
      normalized.max_tokens = Math.max(1, normalized.max_tokens);
    }

    // 清理消息内容
    normalized.messages = normalized.messages.map(msg => ({
      ...msg,
      content: typeof msg.content === 'string' ? msg.content.trim() : msg.content
    }));

    return normalized;
  }
} 