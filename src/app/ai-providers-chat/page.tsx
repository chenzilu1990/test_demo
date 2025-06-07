"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { loadUnifiedTemplates, addTemplate, updateTemplateUsage } from '@/app/prompt-template-settings/utils/dataMigration';
import { ExtendedPromptTemplate, isParameterizedTemplate } from '@/app/prompt-template-settings/types';

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
  const router = useRouter();
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
  const [allTemplates, setAllTemplates] = useState<ExtendedPromptTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showParamTemplates, setShowParamTemplates] = useState(false);
  const [showTemplateGenerator, setShowTemplateGenerator] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [activeParamTemplate, setActiveParamTemplate] = useState<PromptTemplate | undefined>(undefined);
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);

  // 新增：侧边栏控制状态
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  // 从统一数据源加载所有模板
  useEffect(() => {
    try {
      const templates = loadUnifiedTemplates();
      setAllTemplates(templates);
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  }, []);

  // 获取不含参数的模板
  const quickTemplates = allTemplates.filter(template => !isParameterizedTemplate(template));
  
  // 获取含参数的模板
  const paramTemplates = allTemplates.filter(template => isParameterizedTemplate(template));

  // 保存文本模板
  const handleSaveTemplate = (content: string) => {
    const newTemplate: PromptTemplate = {
      title: content.length > 30 ? content.substring(0, 30) + '...' : content,
      prompt: content
    };
    
    // 检查是否已存在相同内容的模板
    if (!allTemplates.some(template => template.prompt === content)) {
      try {
        addTemplate(newTemplate);
        // 重新加载模板列表
        const updatedTemplates = loadUnifiedTemplates();
        setAllTemplates(updatedTemplates);
      } catch (error) {
        console.error('Failed to save template:', error);
      }
    }
  };

  // 使用模板
  const handleUseTemplate = (template: ExtendedPromptTemplate) => {
    setInputPrompt(template.prompt);
    setShowTemplates(false);
    // 记录使用统计
    try {
      updateTemplateUsage(template.id);
      // 重新加载模板列表以更新统计
      setTimeout(() => {
        const updatedTemplates = loadUnifiedTemplates();
        setAllTemplates(updatedTemplates);
      }, 100);
    } catch (error) {
      console.error('Failed to track template usage:', error);
    }
  };

  // 删除文本模板
  const handleDeleteTemplate = (index: number) => {
    const templateToDelete = quickTemplates[index];
    if (templateToDelete) {
      try {
        const { deleteTemplate } = require('@/app/prompt-template-settings/utils/dataMigration');
        deleteTemplate(templateToDelete.id);
        // 重新加载模板列表
        const updatedTemplates = loadUnifiedTemplates();
        setAllTemplates(updatedTemplates);
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  // 保存含参数的模板
  const handleSaveParamTemplate = (template: PromptTemplate) => {
    try {
      addTemplate(template);
      // 重新加载模板列表
      const updatedTemplates = loadUnifiedTemplates();
      setAllTemplates(updatedTemplates);
    } catch (error) {
      console.error('Failed to save param template:', error);
    }
  };

  // 删除含参数的模板
  const handleDeleteParamTemplate = (index: number) => {
    const templateToDelete = paramTemplates[index];
    if (templateToDelete) {
      try {
        const { deleteTemplate } = require('@/app/prompt-template-settings/utils/dataMigration');
        deleteTemplate(templateToDelete.id);
        // 重新加载模板列表
        const updatedTemplates = loadUnifiedTemplates();
        setAllTemplates(updatedTemplates);
      } catch (error) {
        console.error('Failed to delete param template:', error);
      }
    }
  };

  // 显示模板生成器
  const handleShowTemplateGenerator = (prompt: string) => {
    setSelectedPrompt(prompt);
    setShowTemplateGenerator(true);
  };

  // 使用含参数的模板
  const handleUseParamTemplate = (template: ExtendedPromptTemplate) => {
    setActiveParamTemplate(template);
    setInputPrompt(template.prompt);
    setShowParamTemplates(false);
    // 记录使用统计
    try {
      updateTemplateUsage(template.id);
      // 重新加载模板列表以更新统计
      setTimeout(() => {
        const updatedTemplates = loadUnifiedTemplates();
        setAllTemplates(updatedTemplates);
      }, 100);
    } catch (error) {
      console.error('Failed to track template usage:', error);
    }
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

  // 导航到AI提供商配置页面
  const handleNavigateToProviders = () => {
    router.push('/ai-providers');
  };

  // 导航到提示词模板设置页面
  const handleNavigateToTemplateSettings = () => {
    router.push('/prompt-template-settings');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* 左侧边栏 - 模型选择和模板管理 */}
      <div className={`${
        sidebarCollapsed ? 'w-16' : 'w-80'
      } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300`}>
        
        {/* 侧边栏头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {!sidebarCollapsed && (
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI 对话助手</h1>
          )}
            <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            <svg 
              className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {!sidebarCollapsed ? (
          <>
            {/* 模型选择区域 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <ModelSelector
                selectedProviderModel={selectedProviderModel}
                setSelectedProviderModel={setSelectedProviderModel}
                availableModels={availableModels}
                isImageGenerationModel={isImageGenerationModel()}
                onNavigateToProviders={handleNavigateToProviders}
              />
            </div>

            {/* 统一的模板管理区域 */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">提示词模板</h3>
                  <div className="flex gap-1">
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                      共 {paramTemplates.length + quickTemplates.length} 个模板
                    </span>
                  </div>
                </div>
                
                {paramTemplates.length === 0 && quickTemplates.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">
                    暂无提示词模板
                    <br />
                    <span className="text-gray-400">开始对话后可保存常用提示词</span>
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* 包含参数的模板 */}
                    {paramTemplates.slice(0, 2).map((template, index) => (
                      <div
                        key={`param-${index}`}
                        className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-500 text-white text-xs rounded">
                            📋 含参数
                          </span>
                          <span className="font-medium text-sm truncate">{template.title}</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {template.prompt}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {Object.keys(template.parameterOptions || {}).slice(0, 3).map((param) => (
                            <span
                              key={param}
                              className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs"
                            >
                              {param}
                            </span>
                          ))}
                          {Object.keys(template.parameterOptions || {}).length > 3 && (
                            <span className="text-xs text-gray-500">+{Object.keys(template.parameterOptions || {}).length - 3}</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleUseParamTemplate(template)}
                            className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                          >
                            使用
                          </button>
                          <button
                            onClick={() => handleDeleteParamTemplate(index)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* 普通模板 */}
                    {quickTemplates.slice(0, 2).map((template, index) => (
                      <div
                        key={`quick-${index}`}
                        className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-500 text-white text-xs rounded">
                            📝 文本
                          </span>
                          <span className="font-medium text-sm truncate">{template.title}</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2" title={template.prompt}>
                          {template.prompt.length > 60 ? template.prompt.substring(0, 60) + "..." : template.prompt}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleUseTemplate(template)}
                            className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                          >
                            使用
                          </button>
                          <button
                            onClick={() => handleShowTemplateGenerator(template.prompt)}
                            className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
                          >
                            添加参数
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(index)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* 查看更多按钮 */}
                    {(paramTemplates.length > 2 || quickTemplates.length > 2) && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-2 gap-2">
                          {paramTemplates.length > 2 && (
                            <button
                              onClick={() => setShowParamTemplates(true)}
                              className="text-xs text-gray-600 dark:text-gray-400 hover:underline py-1"
                            >
                              查看含参数模板 ({paramTemplates.length})
                            </button>
                          )}
                          {quickTemplates.length > 2 && (
                            <button
                              onClick={() => setShowTemplates(true)}
                              className="text-xs text-gray-600 dark:text-gray-400 hover:underline py-1"
                            >
                              查看文本模板 ({quickTemplates.length})
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 侧边栏底部操作 */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClearConversation}
                className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
              >
                🗑️ 清空对话记录
            </button>
            </div>
          </>
        ) : (
          /* 收起状态的侧边栏 */
          <div className="flex-1 flex flex-col items-center py-4 space-y-4">
            <button
              onClick={() => {
                if (paramTemplates.length > 0) {
                  setShowParamTemplates(true);
                } else if (quickTemplates.length > 0) {
                  setShowTemplates(true);
                }
              }}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
              title="提示词模板"
            >
              <span className="text-lg">📋</span>
              {(paramTemplates.length > 0 || quickTemplates.length > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                  {paramTemplates.length + quickTemplates.length}
                </span>
              )}
            </button>
            <button
              onClick={handleClearConversation}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="清空对话"
            >
              <span className="text-lg">🗑️</span>
            </button>
          </div>
        )}
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 对话区域 - 占据大部分空间 */}
        <div className="flex-1 p-4 min-h-0">
          <ChatDialog
            conversation={conversation}
            error={error}
            onSaveTemplate={handleSaveTemplate}
          />
        </div>

        {/* 输入区域 - 固定在底部 */}
        <div className="border-t border-gray-200 dark:border-gray-700">
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
            availableModels={availableModels}
            onModelSelect={setSelectedProviderModel}
            templates={[...paramTemplates, ...quickTemplates]}
            onNavigateToProviders={handleNavigateToProviders}
            onNavigateToTemplateSettings={handleNavigateToTemplateSettings}
          />
        </div>
      </div>

      {/* 含参数模板选择弹窗 */}
      {showParamTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold">📋 含参数的提示词模板</h3>
            <button
              onClick={() => setShowParamTemplates(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
            >
                &times;
            </button>
          </div>
            <div className="flex-1 overflow-y-auto p-4">
            {paramTemplates.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                暂无含参数的模板
              </p>
            ) : (
                <div className="space-y-4">
                {paramTemplates.map((template, index) => (
                    <div
                    key={index}
                      className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                      <div className="font-medium mb-2">{template.title}</div>
                      <div className="text-sm mb-3 text-gray-600 dark:text-gray-300">
                      {template.prompt}
                    </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                      {Object.keys(template.parameterOptions || {}).map(
                        (param) => (
                          <span
                            key={param}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-xs"
                          >
                            {param}
                          </span>
                        )
                      )}
                    </div>
                      <div className="flex gap-2">
                      <button
                        onClick={() => handleUseParamTemplate(template)}
                          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                          使用模板
                      </button>
                      <button
                        onClick={() => handleDeleteParamTemplate(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        删除
                      </button>
                      </div>
                    </div>
                ))}
                </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* 文本模板选择弹窗 */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold">📝 文本提示词模板</h3>
            <button
              onClick={() => setShowTemplates(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
            >
                &times;
            </button>
          </div>
            <div className="flex-1 overflow-y-auto p-4">
            {quickTemplates.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  暂无文本模板
              </p>
            ) : (
                <div className="space-y-4">
                {quickTemplates.map((template, index) => (
                    <div
                    key={index}
                      className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                      <div className="font-medium mb-2">{template.title}</div>
                      <div className="text-sm mb-3 text-gray-600 dark:text-gray-300" title={template.prompt}>
                        {template.prompt}
                    </div>
                      <div className="flex gap-2">
                      <button
                        onClick={() => handleUseTemplate(template)}
                          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                          使用模板
                      </button>
                      <button
                          onClick={() => handleShowTemplateGenerator(template.prompt)}
                          className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                      >
                        添加参数
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        删除
                      </button>
                      </div>
                    </div>
                ))}
                </div>
            )}
            </div>
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
    </div>
  );
}