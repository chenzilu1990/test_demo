import { PROVIDER_CONFIGS } from './ai-providers/config/providers';
import { createProvider, createOpenAICompatibleProvider } from './ai-providers/core/providerFactory';
import { BaseProvider, ErrorCode, ProviderError } from './ai-providers/core/BaseProvider';
import { ValidationUtils } from './ai-providers/core/validation';
import { SimplePerformanceMonitor, globalPerformanceMonitor } from './ai-providers/core/performance';
import { SimpleCache, CacheKeyGenerator, CachedProvider, globalCache } from './ai-providers/core/cache';
import { AIProvider, ProviderConfig, ProviderOptions, CompletionRequest, CompletionResponse } from './ai-providers/types';

// 导出所有类型和接口
export * from './ai-providers/types';

// 导出配置
export { PROVIDER_CONFIGS };

// 导出工厂函数
export { createProvider, createOpenAICompatibleProvider };

// 导出基类和工具类
export { BaseProvider, ErrorCode, ProviderError, ValidationUtils };

// 导出性能监控工具
export { SimplePerformanceMonitor, globalPerformanceMonitor };

// 导出缓存工具
export { SimpleCache, CacheKeyGenerator, CachedProvider, globalCache };

// 导出具体的提供商实现
export { OpenAIProvider } from './ai-providers/providers/openai';
export { AihubmixProvider } from './ai-providers/providers/aihubmix';
export { AnthropicProvider } from './ai-providers/providers/anthropic';
export { GeminiProvider } from './ai-providers/providers/gemini';
export { OllamaProvider } from './ai-providers/providers/ollama';
export { SiliconFlowProvider } from './ai-providers/providers/siliconflow';

// 创建一个实例的便捷函数
export function createAIProvider(providerId: string, options: ProviderOptions = {}): AIProvider {
  const config = PROVIDER_CONFIGS[providerId];
  if (!config) {
    throw new Error(`Provider with ID ${providerId} not found`);
  }
  
  return createProvider(config, options);
}

// 创建带缓存的AI提供商
export function createCachedAIProvider(
  providerId: string, 
  options: ProviderOptions = {},
  cacheOptions?: { enabled?: boolean; ttl?: number; maxSize?: number }
): CachedProvider {
  const provider = createAIProvider(providerId, options);
  return new CachedProvider(provider, { enabled: true, ...cacheOptions });
}

// 创建管理多个提供商的类
export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private performanceMonitor: SimplePerformanceMonitor;
  
  constructor(configs?: Record<string, ProviderOptions>) {
    this.performanceMonitor = new SimplePerformanceMonitor();
    
    if (configs) {
      for (const [providerId, options] of Object.entries(configs)) {
        if (PROVIDER_CONFIGS[providerId]) {
          this.registerProvider(providerId, options);
        }
      }
    }
  }
  
  registerProvider(providerId: string, options: ProviderOptions = {}): AIProvider {
    const provider = createAIProvider(providerId, options);
    this.providers.set(providerId, provider);
    return provider;
  }
  
  getProvider(providerId: string): AIProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not registered`);
    }
    return provider;
  }
  
  async chat(providerId: string, request: CompletionRequest): Promise<CompletionResponse> {
    const requestId = this.performanceMonitor.startRequest(providerId, request.model);
    
    try {
      const response = await this.getProvider(providerId).chat(request);
      this.performanceMonitor.endRequest(requestId, 'success', response.usage);
      return response;
    } catch (error: any) {
      this.performanceMonitor.endRequest(requestId, 'error', undefined, error.message);
      throw error;
    }
  }
  
  async *chatStream(providerId: string, request: CompletionRequest): AsyncIterable<any> {
    const requestId = this.performanceMonitor.startRequest(providerId, request.model);
    
    try {
      yield* this.getProvider(providerId).chatStream(request);
      this.performanceMonitor.endRequest(requestId, 'success');
    } catch (error: any) {
      this.performanceMonitor.endRequest(requestId, 'error', undefined, error.message);
      throw error;
    }
  }
  
  listProviders(): Array<{id: string, name: string}> {
    return Array.from(this.providers.values()).map(provider => ({
      id: provider.id,
      name: provider.config.name,
    }));
  }
  
  getPerformanceStats(providerId?: string) {
    return this.performanceMonitor.getStats(providerId);
  }
  
  getPerformanceMetrics(providerId?: string) {
    return this.performanceMonitor.getMetrics(providerId);
  }
  
  clearPerformanceMetrics() {
    this.performanceMonitor.clearMetrics();
  }
}
