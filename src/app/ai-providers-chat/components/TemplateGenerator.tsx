import React, { useState, useEffect } from 'react';
import { PromptTemplateWithOptions, ModelOption } from './types';

interface TemplateGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTemplate: (template: PromptTemplateWithOptions) => void;
  provider: any;
  userPrompt: string;
  availableModels: ModelOption[];
}

const TemplateGenerator: React.FC<TemplateGeneratorProps> = ({
  isOpen,
  onClose,
  onSaveTemplate,
  provider,
  userPrompt,
  availableModels
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<PromptTemplateWithOptions | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  // 过滤出文本模型（非图像生成模型）
  const textModels = availableModels.filter(model => {
    const [providerId, modelId] = model.id.split(':');
    // 只保留当前provider的模型
    if (!provider || providerId !== provider.id) return false;
    
    // 检查是否为非图像生成模型
    const modelConfig = provider?.config?.models?.find((m: any) => m.id === modelId);
    return modelConfig && !modelConfig.capabilities?.imageGeneration;
  });

  // 重置状态，避免之前的生成结果干扰
  useEffect(() => {
    if (isOpen) {
      setGeneratedTemplate(null);
      setError('');
    }
  }, [isOpen]);

  // 当可用模型变化时，自动选择第一个文本模型
  useEffect(() => {
    if (textModels.length > 0 && !selectedModel) {
      setSelectedModel(textModels[0].id);
    }
  }, [textModels, selectedModel]);

  // 生成模板的函数
  const generateTemplate = async () => {
    if (!provider) {
      setError('请先选择AI提供商');
      return;
    }

    if (!userPrompt || userPrompt.trim() === '') {
      setError('请先输入提示词');
      return;
    }

    if (!selectedModel) {
      setError('请选择一个文本模型');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // 构建系统提示和用户提示
      const systemPrompt = `你是一个专业的提示词模板生成器。你需要将用户的提示词转换为带参数的模板格式，参数必须用方括号[]包裹。
输出必须是有效的JSON格式，包含以下字段：
1. title: 简短描述模板用途的标题
2. template: 将原始提示词中的具体内容替换为参数的模板
3. parameterOptions: 为每个参数提供可选值的对象，每个参数至少提供5个选项

确保JSON格式有效，每个参数必须有参数选项。每个参数的选项要尽量覆盖不同的可能值，有代表性。`;

      const userInstruction = `请将以下提示词转换为带参数的模板：
${userPrompt}

输出格式示例：
{
  "title": "目标用户画像分析",
  "template": "[国家]市场中，目标群体为[性别]，年龄段[年龄段]，关注品类为[产品或品类]，产品优势为[产品优势]。",
  "parameterOptions": {
    "国家": ["美国", "中国", "印度", "英国", "德国"],
    "性别": ["男性", "女性", "非二元性别"],
    "年龄段": ["13-19岁", "20-35岁", "36-55岁", "56岁及以上"],
    "产品或品类": ["电子产品", "服装和配饰", "美容产品", "健康和健身", "家居用品"],
    "产品优势": ["高性价比", "创新功能", "环保材料", "简易操作", "时尚设计"]
  }
}

注意：直接输出JSON格式，不要添加额外的解释文字。`;

      // 从选择的模型ID中获取实际的模型ID
      const modelIdParts = selectedModel.split(':');
      if (modelIdParts.length !== 2) {
        throw new Error('无效的模型ID格式');
      }
      
      const modelId = modelIdParts[1];
      if (!modelId) {
        throw new Error('无效的模型ID');
      }

      console.log(`使用模型 ${selectedModel} 生成模板`);

      // 调用AI生成模板
      const response = await provider.chat({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInstruction }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      // 解析响应
      if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
        throw new Error('AI返回的响应格式无效');
      }
      
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('AI返回的内容为空');
      }
      
      console.log('生成的模板原始内容：', content);

      // 提取JSON，处理可能包含的代码块
      let jsonStr = content;
      
      // 如果内容被代码块包裹(```json ... ```)，提取代码块内容
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        jsonStr = codeBlockMatch[1];
      } else {
        // 尝试匹配整个内容作为JSON
        const jsonMatch = content.match(/\s*(\{[\s\S]*\})\s*/);
        if (jsonMatch && jsonMatch[1]) {
          jsonStr = jsonMatch[1];
        }
      }
      
      console.log('提取的JSON字符串：', jsonStr);

      try {
        const template = JSON.parse(jsonStr) as PromptTemplateWithOptions;
        
        // 验证解析出的模板格式是否正确
        if (!template.title || !template.template || !template.parameterOptions || 
            typeof template.title !== 'string' || 
            typeof template.template !== 'string' || 
            typeof template.parameterOptions !== 'object') {
          throw new Error('生成的模板格式不正确');
        }
        
        // 验证参数选项
        for (const [param, options] of Object.entries(template.parameterOptions)) {
          if (!Array.isArray(options) || options.length === 0) {
            throw new Error(`参数 "${param}" 的选项格式不正确`);
          }
        }
        
        setGeneratedTemplate(template);
      } catch (parseError: any) {
        console.error('JSON解析错误:', parseError);
        throw new Error(`无法解析生成的模板: ${parseError.message}`);
      }
    } catch (err: any) {
      console.error('生成模板错误:', err);
      setError(err.message || '生成模板时发生错误');
    } finally {
      setIsGenerating(false);
    }
  };

  // 保存模板
  const handleSaveTemplate = () => {
    if (generatedTemplate) {
      onSaveTemplate(generatedTemplate);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-11/12 max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">生成提示词模板</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            &times;
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4">
            <h3 className="font-medium mb-2">原始提示词:</h3>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              {userPrompt || <span className="text-gray-500 dark:text-gray-400">未选择提示词</span>}
            </div>
          </div>

          {/* 模型选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">选择模型:</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              disabled={isGenerating}
            >
              <option value="">请选择文本模型</option>
              {textModels.length === 0 ? (
                <option value="" disabled>无可用的文本模型</option>
              ) : (
                textModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))
              )}
            </select>
            {textModels.length === 0 && (
              <p className="mt-1 text-xs text-red-500">
                {provider ? '当前服务商没有可用的文本模型' : '请先选择一个服务商'}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {generatedTemplate ? (
            <div className="mb-4">
              <h3 className="font-medium mb-2">生成的模板:</h3>
              <div className="border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                  <span className="font-medium">标题:</span> {generatedTemplate.title}
                </div>
                <div className="p-3 bg-white dark:bg-gray-800">
                  <div className="mb-3">
                    <span className="font-medium">模板:</span> 
                    <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto">
                      {generatedTemplate.template}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium">参数选项:</span>
                    <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(generatedTemplate.parameterOptions).map(([param, options]) => (
                        <div key={param} className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                          <div className="font-medium text-sm">{param}:</div>
                          <div className="text-sm mt-1">
                            {options.map((option, i) => (
                              <span key={i} className="inline-block mr-1 mb-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded">
                                {option}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              {isGenerating ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                  <p>正在生成模板...</p>
                </div>
              ) : (
                <button
                  onClick={generateTemplate}
                  disabled={!userPrompt || !selectedModel || textModels.length === 0}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    !userPrompt || !selectedModel || textModels.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  开始生成模板
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            取消
          </button>
          {generatedTemplate && (
            <button
              onClick={handleSaveTemplate}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              保存模板
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateGenerator; 