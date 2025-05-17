import { ProviderConfig, ProviderOptions, AIProvider } from '../types';
import { OpenAIProvider } from '../providers/openai';
import { AnthropicProvider } from '../providers/anthropic';
import { AihubmixProvider } from '../providers/aihubmix';
import { GeminiProvider } from '../providers/gemini';
import { OllamaProvider } from '../providers/ollama';
import { SiliconFlowProvider } from '../providers/siliconflow';

export function createProvider(config: ProviderConfig, options: ProviderOptions = {}): AIProvider {
  switch (config.sdkType) {
    case 'openai':
      return new OpenAIProvider(config, options);
    case 'anthropic':
      return new AnthropicProvider(config, options);
    case 'gemini':
      return new GeminiProvider(config, options);
    case 'custom':
      if (config.id === 'ollama') {
        return new OllamaProvider(config, options);
      }
      if (config.id === 'aihubmix') {
        return new AihubmixProvider(config, options);
      }
      if (config.id === 'siliconflow') {
        return new SiliconFlowProvider(config, options);
      }
      throw new Error(`Unsupported custom provider: ${config.id}`);
    default:
      throw new Error(`Unsupported SDK type: ${config.sdkType}`);
  }
}

export function createOpenAICompatibleProvider(config: ProviderConfig, options: ProviderOptions = {}): AIProvider {
  const openAICompatibleConfig: ProviderConfig = {
    ...config,
    sdkType: 'openai',
  };
  
  return new OpenAIProvider(openAICompatibleConfig, options);
}
