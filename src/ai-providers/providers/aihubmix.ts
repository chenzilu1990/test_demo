import { BaseProvider } from '../core/BaseProvider';
  import { CompletionRequest, CompletionResponse, ProviderConfig, ProviderOptions, ImageGenerationRequest, ImageGenerationResponse } from '../types';
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
      ...config
    };
    
    super(config, options);

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

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // AiHubMix image generation uses an OpenAI-compatible endpoint.
    // The openaiProvider is already configured with baseURL "https://aihubmix.com/v1".
    // The request.model should typically be "gpt-image-1" as per AiHubMix docs,
    // which should be set by the caller.
    // This provider assumes the underlying openaiProvider has implemented generateImage.
    if (!this.openaiProvider.generateImage) {
      throw new Error('Image generation is not supported by the underlying OpenAI provider for AiHubMix.');
    }
    return this.openaiProvider.generateImage(request);
  }

  // 验证请求对于当前模型是否有效
  public validateRequest(request: CompletionRequest): boolean {
    const provider = this.getProviderForModel(request.model);
    return provider.validateRequest(request);
  }

  // AiHubMix特定的连接测试方法
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

      console.log(`Testing AiHubMix connection with model ${testModel}...`);

      // 根据模型选择合适的提供商进行测试
      const provider = this.getProviderForModel(testModel);
      const providerType = testModel.startsWith('claude') ? 'Claude' : 
                          testModel.startsWith('gemini') ? 'Gemini' : 'OpenAI';
      
      console.log(`Using ${providerType} provider for model ${testModel}`);

      // 构建AiHubMix格式的测试请求
      const testRequest: CompletionRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        model: testModel,
        max_tokens: 1,
        temperature: 0
      };

      // 使用选定的提供商进行测试
      const response = await provider.chat(testRequest);
      
      // 检查响应是否有效
      if (response && response.choices && response.choices.length > 0) {
        console.log(`✅ AiHubMix连接测试成功 (${providerType})`);
        return true;
      } else {
        throw new Error('AiHubMix返回了无效的响应格式');
      }
      
    } catch (error: any) {
      console.error(`❌ AiHubMix连接测试失败:`, error.message);
      
      // AiHubMix特定的错误消息处理
      let errorMessage = error.message;
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'AiHubMix API密钥无效，请检查API密钥是否正确';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'AiHubMix API密钥权限不足或账户余额不足，请检查账户状态';
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        errorMessage = 'AiHubMix请求频率过高，请稍后再试或升级您的API计划';
      } else if (error.message.includes('model') && error.message.includes('not found')) {
        errorMessage = `模型 ${model || this.config.models[0]?.id} 在AiHubMix中不可用或已下线`;
      } else if (error.message.includes('SERVICE_UNAVAILABLE')) {
        errorMessage = 'AiHubMix服务暂时不可用，请稍后重试';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'AiHubMix连接超时，请检查网络连接';
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
        errorMessage = '无法连接到AiHubMix服务，请检查网络连接';
      }
      
      throw new Error(errorMessage);
    }
  }
} 