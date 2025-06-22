import React, { memo, useCallback } from 'react';
import PromptEditorWrapper from './PromptEditorWrapper';
import { PromptTemplate, BracketParameterOptions } from "@/components/default-prompt-editor";
import { ModelOption } from './types';

interface ChatInputProps {
  inputPrompt: string;
  setInputPrompt: (value: string) => void;
  bracketOptions: BracketParameterOptions;
  isImageGenerationModel: boolean;
  isDallE3Model: boolean;
  isLoading: boolean;
  selectedProviderModel: string;
  handleSendMessage: () => void;
  activeParamTemplate?: PromptTemplate;
  onGenerateMoreOptions?: (paramName: string, currentOptions: string[]) => Promise<string[]>;
  clearActiveTemplate?: () => void;
  availableModels?: ModelOption[];
  onModelSelect?: (modelId: string) => void;
  templates?: PromptTemplate[];
  onNavigateToProviders?: () => void;
  onNavigateToTemplateSettings?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = memo(({
  inputPrompt,
  setInputPrompt,
  bracketOptions,
  isImageGenerationModel,
  isDallE3Model,
  isLoading,
  selectedProviderModel,
  handleSendMessage,
  activeParamTemplate,
  onGenerateMoreOptions,
  clearActiveTemplate,
  availableModels = [],
  onModelSelect,
  templates = [],
  onNavigateToProviders,
  onNavigateToTemplateSettings
}) => {
  const handleInputChange = useCallback((value: string) => {
    setInputPrompt(value);
    if (value === '' && clearActiveTemplate && activeParamTemplate) {
      clearActiveTemplate();
    }
  }, [setInputPrompt, clearActiveTemplate, activeParamTemplate]);

  const handleClear = useCallback(() => {
    setInputPrompt('');
    clearActiveTemplate?.();
  }, [setInputPrompt, clearActiveTemplate]);

  const placeholder = isImageGenerationModel
    ? "描述您想要生成的图像..."
    : "输入您的问题或指令...";

  const hintText = isImageGenerationModel
    ? `提示：可以使用 [图像尺寸]${isDallE3Model ? ', [图像质量], [图像风格]' : ''} 来设置参数。Enter 发送，Shift+Enter 换行`
    : "提示：可以使用 [温度]、[最大令牌] 来调整参数，或输入@选择模型、#选择模板。Enter 发送，Shift+Enter 换行";

  const buttonDisabled = !inputPrompt.trim() || !selectedProviderModel || isLoading;
  const buttonText = isLoading ? '处理中...' : isImageGenerationModel ? '生成图像' : '发送';

  const handleEnterPress = useCallback((event: KeyboardEvent) => {
    if (!buttonDisabled) {
      handleSendMessage();
    }
  }, [buttonDisabled, handleSendMessage]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4">
      <div className="container mx-auto max-w-4xl">
        <PromptEditorWrapper
          value={inputPrompt}
          onChange={handleInputChange}
          templates={templates}
          bracketOptions={bracketOptions}
          placeholder={placeholder}
          height="8rem"
          paramTemplate={activeParamTemplate}
          onGenerateMoreOptions={onGenerateMoreOptions}
          onClear={handleClear}
          availableModels={availableModels}
          selectedProviderModel={selectedProviderModel}
          onModelSelect={onModelSelect}
          isImageGenerationModel={isImageGenerationModel}
          onNavigateToProviders={onNavigateToProviders}
          onNavigateToTemplateSettings={onNavigateToTemplateSettings}
          onEnterPress={handleEnterPress}
        />

        <div className="mt-3 flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>{hintText}</p>
            {activeParamTemplate && (
              <p className="mt-1 text-blue-600 dark:text-blue-400">
                📋 使用模板: {activeParamTemplate.title}
              </p>
            )}
          </div>

          <div className="flex gap-3 items-center">
            {/* 当前模型指示器 */}
            {selectedProviderModel && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                  🤖 {availableModels.find(m => m.id === selectedProviderModel)?.name || selectedProviderModel}
                </span>
              </div>
            )}

            <button
              onClick={handleSendMessage}
              disabled={buttonDisabled}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                buttonDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
              }`}
              aria-label={buttonText}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {buttonText}
                </span>
              ) : (
                buttonText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput; 