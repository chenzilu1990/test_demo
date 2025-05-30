"use client";

import { useState, useEffect, useMemo } from 'react';
import { createProvider } from '@/ai-providers/core/providerFactory';
import { PROVIDER_CONFIGS } from '@/ai-providers/config/providers';
import { 
  AIProvider, 
  ModelCard, 
  CompletionRequest,
  ImageGenerationRequest,
  ChatMessage 
} from '@/ai-providers/types';
import InteractivePrompt from '@/components/InteractivePrompt';
import { BracketOption } from '@/components/types';

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
  timestamp: Date;
  model?: string;
}

// 定义交互式提示词的选项
const getBracketOptions = (isDallE3: boolean): Record<string, BracketOption> => {
  const options: Record<string, BracketOption> = {
    "图像尺寸": {
      type: "single",
      options: isDallE3 
        ? ["1024x1024", "1024x1792", "1792x1024"]
        : ["256x256", "512x512", "1024x1024"]
    },
    "温度": {
      type: "single",
      options: ["0", "0.3", "0.5", "0.7", "1.0", "1.5", "2.0"]
    },
    "最大令牌": {
      type: "single",
      options: ["100", "500", "1000", "2000", "4000"]
    }
  };

  if (isDallE3) {
    options["图像质量"] = {
      type: "single",
      options: ["standard", "hd"]
    };
    options["图像风格"] = {
      type: "single",
      options: ["vivid", "natural"]
    };
  }
  return options;
};

export default function AIChatPage() {
  const [selectedProviderModel, setSelectedProviderModel] = useState<string>('');
  const [provider, setProvider] = useState<AIProvider | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(1000);
  const [availableModels, setAvailableModels] = useState<Array<{id: string, name: string, provider: string}>>([]);

  const isDallE3Model = useMemo(() => {
    if (!selectedProviderModel) return false;
    const [_, modelId] = selectedProviderModel.split(':');
    return modelId === 'dall-e-3';
  }, [selectedProviderModel]);

  const bracketOptions = useMemo(() => getBracketOptions(isDallE3Model), [isDallE3Model]);

  // 获取所有可用的模型列表
  const getAvailableModels = () => {
    if (typeof window === 'undefined') return [];
    
    const savedConfigs = localStorage.getItem('ai-providers-config');
    if (!savedConfigs) {
      console.log('未找到已配置的服务商');
      return [];
    }
    
    try {
      const configs = JSON.parse(savedConfigs);
      const models: Array<{id: string, name: string, provider: string}> = [];
      
      console.log('已配置的服务商:', Object.keys(configs));
      
      Object.entries(PROVIDER_CONFIGS).forEach(([providerId, config]) => {
        const providerConfig = configs[providerId];
        if (providerConfig?.enabled && providerConfig?.status === 'connected') {
          console.log(`加载服务商 ${providerId} 的模型:`, config.models);
          config.models.forEach(model => {
            models.push({
              id: `${providerId}:${model.id}`,
              name: `${config.name} - ${model.name}`,
              provider: providerId
            });
          });
        }
      });
      
      console.log('可用模型列表:', models);
      return models;
    } catch (error) {
      console.error('解析服务商配置时出错:', error);
      return [];
    }
  };

  // 加载可用模型
  useEffect(() => {
    const models = getAvailableModels();
    console.log('设置可用模型:', models);
    setAvailableModels(models);
    if (models.length > 0 && !selectedProviderModel) {
      setSelectedProviderModel(models[0].id);
    }
  }, []);

  // 当选择模型时，加载对应的 provider
  useEffect(() => {
    if (selectedProviderModel) {
      const [providerId, modelId] = selectedProviderModel.split(':');
      console.log('选择模型:', { providerId, modelId });
      
      const savedConfigs = localStorage.getItem('ai-providers-config');
      if (savedConfigs) {
        try {
          const configs = JSON.parse(savedConfigs);
          const providerConfig = configs[providerId];
          
          if (!providerConfig?.apiKey) {
            console.error(`未找到服务商 ${providerId} 的 API 密钥`);
            return;
          }
          
          setApiKey(providerConfig.apiKey);
          console.log(`创建服务商实例: ${providerId}`);
          
          const providerInstance = createProvider(PROVIDER_CONFIGS[providerId], {
            apiKey: providerConfig.apiKey,
            baseURL: providerConfig.baseURL
          });
          setProvider(providerInstance);
        } catch (error) {
          console.error('加载服务商时出错:', error);
        }
      }
    }
  }, [selectedProviderModel]);

  // 检查是否是图像生成模型
  const isImageGenerationModel = () => {
    if (!provider || !selectedProviderModel) return false;
    const [_, modelId] = selectedProviderModel.split(':');
    const model = provider.getModelById(modelId);
    return model?.capabilities.imageGeneration === true;
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputPrompt.trim() || !provider || !selectedProviderModel || isLoading) return;

    const [providerId, modelId] = selectedProviderModel.split(':');
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputPrompt,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);
    setError('');

    try {
      if (isImageGenerationModel()) {
        // 图像生成
        if (!provider.generateImage) {
          throw new Error('该服务商不支持图像生成');
        }

        // 从提示词中提取参数
        let size: any = '1024x1024';
        let quality: any = 'standard';
        let style: any = 'vivid';

        // 检查是否有选择的参数
        const sizeMatch = inputPrompt.match(/(256x256|512x512|1024x1024|1024x1792|1792x1024)/);
        if (sizeMatch) size = sizeMatch[1];
        
        const qualityMatch = inputPrompt.match(/(standard|hd)/);
        if (qualityMatch) quality = qualityMatch[1];
        
        const styleMatch = inputPrompt.match(/(vivid|natural)/);
        if (styleMatch) style = styleMatch[1];

        // 清理提示词，移除参数
        const cleanPrompt = inputPrompt
          .replace(/(256x256|512x512|1024x1024|1024x1792|1792x1024)/g, '')
          .replace(/(standard|hd)/g, '')
          .replace(/(vivid|natural)/g, '')
          .trim();

        const imageRequest: ImageGenerationRequest = {
          model: modelId,
          prompt: cleanPrompt,
          n: 1,
          size,
          quality,
          style,
          response_format: 'url'
        };

        const response = await provider.generateImage(imageRequest);
        
        const assistantMessage: ConversationMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data[0].revised_prompt || cleanPrompt,
          imageUrl: response.data[0].url,
          timestamp: new Date(),
          model: modelId
        };

        setConversation(prev => [...prev, assistantMessage]);
      } else {
        // 文本对话
        const messages: ChatMessage[] = [
          ...conversation.filter(msg => msg.role !== 'assistant' || !msg.imageUrl).map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: 'user' as const, content: inputPrompt }
        ];

        // 从提示词中提取参数
        const tempMatch = inputPrompt.match(/温度[:：]\s*(\d+\.?\d*)/);
        if (tempMatch) setTemperature(parseFloat(tempMatch[1]));
        
        const tokensMatch = inputPrompt.match(/最大令牌[:：]\s*(\d+)/);
        if (tokensMatch) setMaxTokens(parseInt(tokensMatch[1]));

        const request: CompletionRequest = {
          model: modelId,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false
        };

        const response = await provider.chat(request);
        
        // 处理可能是数组的 content
        const messageContent = response.choices[0].message.content;
        const assistantMessage: ConversationMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: typeof messageContent === 'string' 
            ? messageContent 
            : JSON.stringify(messageContent),
          timestamp: new Date(),
          model: modelId
        };

        setConversation(prev => [...prev, assistantMessage]);
      }
    } catch (err: any) {
      let errorMessage = '发生未知错误';
      if (err && typeof err.message === 'string') {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err) {
        // 如果 err 是一个对象但没有 message 属性，尝试转换为字符串
        try {
          errorMessage = JSON.stringify(err);
        } catch (e) {
          // 转换失败，保持通用错误消息
        }
      }
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 清空对话
  const handleClearConversation = () => {
    setConversation([]);
    setError('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-xl font-semibold">AI 对话测试</h1>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 container mx-auto px-4 py-4 flex flex-col min-h-0">
        {/* 模型选择区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">选择模型</label>
            <select
              value={selectedProviderModel}
              onChange={(e) => setSelectedProviderModel(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">请选择模型</option>
              {availableModels.length === 0 ? (
                <option value="" disabled>请先在 AI 服务商配置中心配置并测试服务商</option>
              ) : (
                availableModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                    {isImageGenerationModel() && ' (图像生成)'}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedProviderModel && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p className="text-sm">
                当前模型: <strong>{selectedProviderModel.split(':')[1]}</strong>
                {isImageGenerationModel() ? ' - 图像生成模式' : ' - 对话模式'}
              </p>
            </div>
          )}

          {availableModels.length === 0 && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                请先在 <a href="/ai-providers-test" className="underline">AI 服务商配置中心</a> 配置并测试服务商
              </p>
            </div>
          )}
        </div>

        {/* 对话历史区域 */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-0">
          {/* 对话内容 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">暂无对话记录</p>
              </div>
            ) : (
              conversation.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'
                    }`}
                  >
                    <div className="text-xs opacity-75 mb-1">
                      {msg.role === 'user' ? '您' : `AI (${msg.model})`}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Generated"
                        className="mt-2 rounded-lg max-w-full"
                      />
                    )}
                    <div className="text-xs mt-1 opacity-75 text-right">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* 固定在底部的输入区域 */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
        <div className="container mx-auto">
          <InteractivePrompt
            value={inputPrompt}
            onChange={setInputPrompt}
            bracketOptions={bracketOptions}
            placeholder={
              isImageGenerationModel()
                ? "描述您想要生成的图像..."
                : "输入您的问题或指令..."
            }
            height="8rem"
          />

          <div className="mt-2 flex justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {isImageGenerationModel() && (
                <p>
                  提示：可以使用 [图像尺寸]
                  {isDallE3Model && ', [图像质量], [图像风格]'}
                  来设置参数
                </p>
              )}
              {!isImageGenerationModel() && (
                <p>提示：可以使用 [温度]、[最大令牌] 来调整参数</p>
              )}
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!inputPrompt.trim() || !selectedProviderModel || isLoading}
              className={`px-4 py-2 rounded-full font-medium ${
                !inputPrompt.trim() || !selectedProviderModel || isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isLoading ? '处理中...' : isImageGenerationModel() ? '生成图像' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}