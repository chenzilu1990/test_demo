"use client";

import { useState, useEffect, useMemo } from 'react';
import { createProvider } from '@/ai-providers/core/providerFactory';
import { PROVIDER_CONFIGS } from '@/ai-providers/config/providers';
import { 
  AIProvider, 
  CompletionRequest,
  ImageGenerationRequest,
  ChatMessage 
} from '@/ai-providers/types';
import { ConversationMessage, ModelOption } from './components/types';
import { PromptTemplate } from '@/components/prompt-editor/types';
import { BracketParameterOptions } from "@/components/prompt-editor/types";
import ChatDialog from './components/ChatDialog';
import ChatInput from './components/ChatInput';
import ModelSelector from './components/ModelSelector';
import TemplateGenerator from './components/TemplateGenerator';

// 定义交互式提示词的选项
const getBracketOptions = (isDallE3: boolean): BracketParameterOptions => {
  const options: BracketParameterOptions = {
    "图像尺寸": isDallE3 
      ? ["1024x1024", "1024x1792", "1792x1024"]
      : ["256x256", "512x512", "1024x1024"],
    "温度": ["0", "0.3", "0.5", "0.7", "1.0", "1.5", "2.0"],
    "最大令牌": ["100", "500", "1000", "2000", "4000"]
  };

  if (isDallE3) {
    options["图像质量"] = ["standard", "hd"];
    options["图像风格"] = ["vivid", "natural"];
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
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // 参数化模板相关状态
  const [paramTemplates, setParamTemplates] = useState<PromptTemplate[]>([]);
  const [showParamTemplates, setShowParamTemplates] = useState(false);
  const [showTemplateGenerator, setShowTemplateGenerator] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [activeParamTemplate, setActiveParamTemplate] = useState<PromptTemplate | undefined>(undefined);
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);

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
      const models: ModelOption[] = [];
      
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

  // 保存和加载模板
  useEffect(() => {
    // 从localStorage加载模板
    const savedTemplates = localStorage.getItem('ai-chat-templates');
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        if (Array.isArray(parsed)) {
          setTemplates(parsed);
        }
      } catch (e) {
        console.error('Failed to load saved templates:', e);
      }
    }
  }, []);

  // 保存模板
  const handleSaveTemplate = (content: string) => {
    const newTemplates = [...templates];
    if (!newTemplates.includes(content)) {
      newTemplates.push(content);
      setTemplates(newTemplates);
      localStorage.setItem('ai-chat-templates', JSON.stringify(newTemplates));
    }
  };

  // 使用模板
  const handleUseTemplate = (template: string) => {
    setInputPrompt(template);
    setShowTemplates(false);
  };

  // 删除模板
  const handleDeleteTemplate = (index: number) => {
    const newTemplates = [...templates];
    newTemplates.splice(index, 1);
    setTemplates(newTemplates);
    localStorage.setItem('ai-chat-templates', JSON.stringify(newTemplates));
  };

  // 加载参数化模板
  useEffect(() => {
    const savedParamTemplates = localStorage.getItem('ai-chat-param-templates');
    if (savedParamTemplates) {
      try {
        const parsed = JSON.parse(savedParamTemplates);
        if (Array.isArray(parsed)) {
          setParamTemplates(parsed);
        }
      } catch (e) {
        console.error('Failed to load saved parametrized templates:', e);
      }
    }
  }, []);

  // 保存参数化模板
  const handleSaveParamTemplate = (template: PromptTemplate) => {
    const newTemplates = [...paramTemplates, template];
    setParamTemplates(newTemplates);
    localStorage.setItem('ai-chat-param-templates', JSON.stringify(newTemplates));
  };

  // 删除参数化模板
  const handleDeleteParamTemplate = (index: number) => {
    const newTemplates = [...paramTemplates];
    newTemplates.splice(index, 1);
    setParamTemplates(newTemplates);
    localStorage.setItem('ai-chat-param-templates', JSON.stringify(newTemplates));
  };

  // 显示模板生成器
  const handleShowTemplateGenerator = (prompt: string) => {
    setSelectedPrompt(prompt);
    setShowTemplateGenerator(true);
  };

  // 使用参数化模板
  const handleUseParamTemplate = (template: PromptTemplate) => {
    setActiveParamTemplate(template);
    setInputPrompt(template.prompt);
    setShowParamTemplates(false);
  };

  // 清除活动模板
  const clearActiveTemplate = () => {
    setActiveParamTemplate(undefined);
  };

  // 使用LLM生成更多参数选项
  const handleGenerateMoreOptions = async (paramName: string, currentOptions: string[]): Promise<string[]> => {
    if (!provider || !selectedProviderModel) {
      throw new Error("请先选择AI提供商和模型");
    }

    setIsGeneratingOptions(true);
    
    try {
      // 获取非图像生成模型
      const [providerId, modelId] = selectedProviderModel.split(':');
      let useModelId = modelId;
      
      // 如果当前是图像生成模型，则尝试找到同一提供商的文本模型
      if (isImageGenerationModel()) {
        const textModel = availableModels.find(model => {
          const [pId, mId] = model.id.split(':');
          if (pId !== providerId) return false;
          
          const modelConfig = provider?.config?.models?.find((m: any) => m.id === mId);
          return modelConfig && !modelConfig.capabilities?.imageGeneration;
        });
        
        if (textModel) {
          useModelId = textModel.id.split(':')[1];
        } else {
          throw new Error("未找到可用的文本模型");
        }
      }
      
      // 构建系统提示和用户提示
      const systemPrompt = `你是一个选项生成助手。用户将提供一个参数名称和现有选项列表，你需要生成10个新的、多样化的、与参数相关的选项。`;
      
      const userPrompt = `参数名称: ${paramName}
现有选项: ${currentOptions.join(', ')}

请生成10个与"${paramName}"相关的新选项，这些选项应该:
1. 不与现有选项重复
2. 保持多样性，覆盖不同的可能值
3. 与参数的语义相关
4. 实用且具体

直接以JSON数组格式返回，不要添加额外解释。例如:
["选项1", "选项2", "选项3", ...]`;

      // 调用AI生成新选项
      const response = await provider.chat({
        model: useModelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1000
      });
      
      // 解析响应
      const content = response.choices[0].message.content as string;
      console.log('生成的选项内容:', content);
      
      // 尝试从内容中提取JSON数组
      let newOptions: string[] = [];
      
      // 尝试多种可能的格式
      try {
        // 直接作为JSON解析
        newOptions = JSON.parse(content);
      } catch (e) {
        // 尝试匹配JSON数组部分
        const arrayMatch = content.match(/\[([\s\S]*?)\]/);
        if (arrayMatch && arrayMatch[0]) {
          try {
            newOptions = JSON.parse(arrayMatch[0]);
          } catch (e2) {
            // 如果仍然无法解析，尝试手动分割
            newOptions = content
              .replace(/^\s*\[|\]\s*$/g, '') // 移除开头和结尾的方括号
              .split(/,\s*"/)                // 按逗号分割
              .map((item: string) => 
                item.replace(/^"|\s*"$/g, '') // 移除引号
                    .trim()
              )
              .filter((item: string) => item.length > 0);
          }
        }
      }
      
      // 确保是字符串数组
      newOptions = newOptions
        .filter((item: any) => typeof item === 'string' && item.trim().length > 0)
        .map((item: string) => item.trim());
      
      if (newOptions.length === 0) {
        throw new Error("无法从AI响应中提取有效选项");
      }
      
      return newOptions;
    } catch (err: any) {
      console.error("生成选项错误:", err);
      throw err;
    } finally {
      setIsGeneratingOptions(false);
    }
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
        
        // 检查响应格式是否正确
        if (!response || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
          throw new Error('图像生成API返回的数据格式无效');
        }
        
        // 处理图像URL - 可能是url或base64数据
        let imageUrl = '';
        if (response.data[0].url) {
          imageUrl = response.data[0].url;
        } else if (response.data[0].b64_json) {
          // 如果返回的是base64数据，转换为可显示的Data URL
          imageUrl = `data:image/png;base64,${response.data[0].b64_json}`;
        } else {
          throw new Error('图像生成API没有返回有效的图像数据');
        }
        
        const assistantMessage: ConversationMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data[0].revised_prompt || cleanPrompt,
          imageUrl: imageUrl,
          timestamp: new Date(),
          model: modelId
        };

        // 添加调试日志
        console.log('图像生成响应:', response);
        console.log('获取到的图像URL:', imageUrl);

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
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold">AI 对话测试</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowParamTemplates(!showParamTemplates)}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
            >
              参数模板 ({paramTemplates.length})
            </button>
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
            >
              模板 ({templates.length})
            </button>
            <button 
              onClick={handleClearConversation}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
            >
              清空对话
            </button>
          </div>
        </div>
      </div>

      {/* 参数化模板选择弹窗 */}
      {showParamTemplates && (
        <div className="absolute top-16 right-4 z-10 w-96 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-medium">参数化提示词模板</h3>
            <button onClick={() => setShowParamTemplates(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <span>&times;</span>
            </button>
          </div>
          <div className="p-2">
            {paramTemplates.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">暂无参数化模板</p>
              ) : (
              <ul className="space-y-2">
                {paramTemplates.map((template, index) => (
                  <li key={index} className="relative p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="font-medium mb-1">{template.title}</div>
                    <div className="text-sm mb-2 text-gray-600 dark:text-gray-300">
                      {template.prompt}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {Object.keys(template.parameterOptions || {}).map(param => (
                        <span key={param} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-xs">
                          {param}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1 justify-end">
                      <button 
                        onClick={() => handleUseParamTemplate(template)}
                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        使用
                      </button>
                      <button 
                        onClick={() => handleDeleteParamTemplate(index)}
                        className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        删除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
            </div>
          )}

      {/* 普通模板选择弹窗 */}
      {showTemplates && (
        <div className="absolute top-16 right-4 z-10 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-medium">提示词模板</h3>
            <button onClick={() => setShowTemplates(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <span>&times;</span>
            </button>
            </div>
          <div className="p-2">
            {templates.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">暂无模板</p>
            ) : (
              <ul className="space-y-1">
                {templates.map((template, index) => (
                  <li key={index} className="relative group p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <div className="text-sm truncate mb-1" title={template}>
                      {template.length > 50 ? template.substring(0, 50) + '...' : template}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleUseTemplate(template)}
                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        使用
                      </button>
                      <button 
                        onClick={() => handleShowTemplateGenerator(template)}
                        className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        生成参数模板
                      </button>
                      <button 
                        onClick={() => handleDeleteTemplate(index)}
                        className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        删除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 模板生成器 */}
      <TemplateGenerator 
        isOpen={showTemplateGenerator}
        onClose={() => setShowTemplateGenerator(false)}
        onSaveTemplate={handleSaveParamTemplate}
        provider={provider}
        userPrompt={selectedPrompt}
        availableModels={availableModels}
      />

      {/* 主要内容区域 */}
      <div className="flex-1 container mx-auto px-4 py-4 flex flex-col min-h-0">
        {/* 模型选择区域 */}
        <ModelSelector 
          selectedProviderModel={selectedProviderModel}
          setSelectedProviderModel={setSelectedProviderModel}
          availableModels={availableModels}
          isImageGenerationModel={isImageGenerationModel()}
        />

        {/* 对话历史区域 */}
        <ChatDialog 
          conversation={conversation} 
          error={error}
          onSaveTemplate={handleSaveTemplate}
        />
      </div>

      {/* 固定在底部的输入区域 */}
      <ChatInput 
        inputPrompt={inputPrompt}
        setInputPrompt={setInputPrompt}
            bracketOptions={bracketOptions}
        isImageGenerationModel={isImageGenerationModel()}
        isDallE3Model={isDallE3Model}
        isLoading={isLoading}
        selectedProviderModel={selectedProviderModel}
        handleSendMessage={handleSendMessage}
        activeParamTemplate={activeParamTemplate}
        onGenerateMoreOptions={handleGenerateMoreOptions}
        clearActiveTemplate={clearActiveTemplate}
      />
    </div>
  );
}