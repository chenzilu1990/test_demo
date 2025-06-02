import React, { useState, useEffect, useCallback } from 'react';
import { PromptTemplate } from '@/components/prompt-editor/types';
import { ModelOption } from '@/app/ai-providers-chat/components/types';
import { AIProvider } from '@/ai-providers/types';
import ModelFilter from './ModelFilter';
import TemplatePreview from './TemplatePreview';
import { generateTemplateFromPrompt } from './templateUtils';

interface TemplateGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTemplate: (template: PromptTemplate) => void;
  provider: AIProvider | null;
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
  const [generatedTemplate, setGeneratedTemplate] = useState<PromptTemplate | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setGeneratedTemplate(null);
      setError('');
    }
  }, [isOpen]);

  // 生成模板
  const generateTemplate = useCallback(async () => {
    if (!provider) {
      setError('请先选择AI提供商');
      return;
    }

    if (!userPrompt?.trim()) {
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
      const template = await generateTemplateFromPrompt(provider, selectedModel, userPrompt);
      setGeneratedTemplate(template);
    } catch (err: any) {
      console.error('生成模板错误:', err);
      setError(err.message || '生成模板时发生错误');
    } finally {
      setIsGenerating(false);
    }
  }, [provider, selectedModel, userPrompt]);

  // 保存模板
  const handleSaveTemplate = useCallback(() => {
    if (generatedTemplate) {
      onSaveTemplate(generatedTemplate);
      onClose();
    }
  }, [generatedTemplate, onSaveTemplate, onClose]);

  // 处理ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-11/12 max-w-3xl max-h-[90vh] flex flex-col"
        role="dialog"
        aria-labelledby="template-generator-title"
        aria-modal="true"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 id="template-generator-title" className="text-xl font-semibold">
            生成提示词模板
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="关闭对话框"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          {/* 原始提示词 */}
          <div className="mb-4">
            <h3 className="font-medium mb-2">原始提示词:</h3>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              {userPrompt || <span className="text-gray-500 dark:text-gray-400">未选择提示词</span>}
            </div>
          </div>

          {/* 模型选择 */}
          <ModelFilter
            provider={provider}
            availableModels={availableModels}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={isGenerating}
          />

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg" role="alert">
              {error}
            </div>
          )}

          {/* 生成结果或生成按钮 */}
          {generatedTemplate ? (
            <TemplatePreview template={generatedTemplate} />
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
                  disabled={!userPrompt || !selectedModel}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    !userPrompt || !selectedModel
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

        {/* 底部按钮 */}
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