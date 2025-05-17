import { PROVIDER_CONFIGS } from './config/providers';
import { createProvider, createOpenAICompatibleProvider } from './core/providerFactory';
import { BaseProvider } from './core/BaseProvider';
import { AIProvider, ProviderConfig, ProviderOptions, CompletionRequest, CompletionResponse } from './types';

// 导出所有类型和接口
export * from './types';

// 导出核心类和工厂函数
export {
  BaseProvider,
  createProvider,
  createOpenAICompatibleProvider,
  PROVIDER_CONFIGS,
};

// 导出各服务商实现
export { OpenAIProvider } from './providers/openai';
export { AnthropicProvider } from './providers/anthropic';
export { AihubmixProvider } from './providers/aihubmix';
export { GeminiProvider } from './providers/gemini';
export { OllamaProvider } from './providers/ollama';
export { SiliconFlowProvider } from './providers/siliconflow';

// 创建一个实例的便捷函数
export function createAIProvider(providerId: string, options: ProviderOptions = {}): AIProvider {
  const config = PROVIDER_CONFIGS[providerId];
  if (!config) {
    throw new Error(`Provider with ID ${providerId} not found`);
  }
  
  return createProvider(config, options);
}

// 创建管理多个提供商的类
export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  
  constructor(configs?: Record<string, ProviderOptions>) {
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
    return this.getProvider(providerId).chat(request);
  }
  
  async *chatStream(providerId: string, request: CompletionRequest): AsyncIterable<any> {
    yield* this.getProvider(providerId).chatStream(request);
  }
  
  listProviders(): Array<{id: string, name: string}> {
    return Array.from(this.providers.values()).map(provider => ({
      id: provider.id,
      name: provider.config.name,
    }));
  }
}
