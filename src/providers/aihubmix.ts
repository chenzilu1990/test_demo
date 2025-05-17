import { BaseProvider } from '../core/BaseProvider';
import { CompletionRequest, CompletionResponse, ProviderConfig, ProviderOptions } from '../types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';

/**
 * AihubmixProvider - 根据模型类型自动选择不同的处理方式
 * 使用装饰器模式实现 - 可以透明地切换底层服务商
 */
export class AihubmixProvider extends BaseProvider {
  private openaiProvider: OpenAIProvider;
  private anthropicProvider: AnthropicProvider;
  private geminiProvider: GeminiProvider;
  private currentProvider: BaseProvider | null = null;

  constructor(config: ProviderConfig, options: ProviderOptions = {}) {
    // 确保config中包含模型列表
    const aihubConfig: ProviderConfig = {
      ...config,
      id: 'aihubmix',
      name: 'AiHubMix',
      baseURL: 'https://aihubmix.com/v1',
      authType: 'key',
      sdkType: 'custom',
      models: [
        {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          capabilities: {
            contextWindowTokens: 128000,
            functionCall: true,
            vision: true
          }
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          capabilities: {
            contextWindowTokens: 16000,
            functionCall: true
          }
        },
        {
          id: 'claude-3-opus',
          name: 'Claude 3 Opus',
          capabilities: {
            contextWindowTokens: 200000,
            vision: true
          }
        },
        {
          id: 'claude-3-sonnet',
          name: 'Claude 3 Sonnet',
          capabilities: {
            contextWindowTokens: 180000,
            vision: true
          }
        },
        {
          id: 'claude-3-haiku',
          name: 'Claude 3 Haiku',
          capabilities: {
            contextWindowTokens: 150000,
            vision: true
          }
        },
        {
          id: 'gemini-pro',
          name: 'Gemini Pro',
          capabilities: {
            contextWindowTokens: 32000
          }
        },
        {
          id: 'gemini-ultra',
          name: 'Gemini Ultra',
          capabilities: {
            contextWindowTokens: 32000,
            vision: true
          }
        }
      ],
      website: {
        official: 'https://aihubmix.com',
        apiDocs: 'https://doc.aihubmix.com',
        pricing: 'https://aihubmix.com/pricing',
      },
      capabilities: {
        streaming: true,
        batchRequests: false,
      },
    };
    
    super(aihubConfig, options);

    // 初始化各种服务商
    const openaiConfig: ProviderConfig = {
      ...aihubConfig,
      id: 'aihubmix-openai',
      name: 'AiHubMix OpenAI',
      baseURL: 'https://aihubmix.com/v1',
      sdkType: 'openai',
    };
    this.openaiProvider = new OpenAIProvider(openaiConfig, options);

    const anthropicConfig: ProviderConfig = {
      ...aihubConfig,
      id: 'aihubmix-anthropic',
      name: 'AiHubMix Claude',
      baseURL: 'https://aihubmix.com/claude/v1',
      sdkType: 'anthropic',
    };
    this.anthropicProvider = new AnthropicProvider(anthropicConfig, options);

    const geminiConfig: ProviderConfig = {
      ...aihubConfig,
      id: 'aihubmix-gemini',
      name: 'AiHubMix Gemini',
      baseURL: 'https://aihubmix.com/gemini',
      sdkType: 'gemini',
    };
    this.geminiProvider = new GeminiProvider(geminiConfig, options);
  }

  // 根据模型名称判断使用哪个服务商
  private getProviderForModel(model: string): BaseProvider {
    if (model.startsWith('claude')) {
      return this.anthropicProvider;
    } else if (model.startsWith('gemini')) {
      return this.geminiProvider;
    } else {
      return this.openaiProvider;
    }
  }

  async chat(request: CompletionRequest): Promise<CompletionResponse> {
    // 选择合适的provider
    this.currentProvider = this.getProviderForModel(request.model);
    return this.currentProvider.chat(request);
  }

  async *chatStream(request: CompletionRequest): AsyncIterable<any> {
    // 选择合适的provider
    this.currentProvider = this.getProviderForModel(request.model);
    
    // 将处理委托给选定的provider
    yield* this.currentProvider.chatStream(request);
  }

  // 验证请求对于当前模型是否有效
  public validateRequest(request: CompletionRequest): boolean {
    const provider = this.getProviderForModel(request.model);
    return provider.validateRequest(request);
  }
} 