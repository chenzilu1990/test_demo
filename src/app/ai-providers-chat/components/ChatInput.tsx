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
  isStreaming?: boolean;
  onStopStreaming?: () => void;
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
  onNavigateToTemplateSettings,
  isStreaming = false,
  onStopStreaming
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
    ? "请描述您想要生成的图像，例如：一只可爱的猫咪在花园里玩耍"
    : "有什么可以帮助您的吗？";

  const hintText = isImageGenerationModel
    ? `💡 小提示：使用 [图像尺寸]${isDallE3Model ? '、[图像质量]、[图像风格]' : ''} 可自定义生成参数`
    : "💡 快捷键：@ 切换模型 | # 使用模板 | / 查看命令 | Enter 发送";

  const buttonDisabled = !inputPrompt.trim() || !selectedProviderModel || isLoading;
  const buttonText = isLoading ? '处理中...' : isImageGenerationModel ? '生成图像' : '发送';

  const handleEnterPress = useCallback((event: KeyboardEvent) => {
    if (!buttonDisabled) {
      handleSendMessage();
    }
  }, [buttonDisabled, handleSendMessage]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4">
        <div className="flex gap-3">
          <div className="flex-1">
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
          </div>
          
          {/* 发送/停止按钮 */}
          <div className="flex items-end">
            {isStreaming ? (
              <button
                onClick={onStopStreaming}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
                title="停止生成"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSendMessage}
                disabled={buttonDisabled}
                className={`px-4 py-2 rounded-lg font-medium shadow-md transition-all duration-200 ${
                  buttonDisabled
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg'
                }`}
                title={isImageGenerationModel ? '生成图像' : '发送消息'}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    处理中...
                  </span>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          {/* 当前模型指示器 */}
          {selectedProviderModel && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                🤖{" "}
                {availableModels.find((m) => m.id === selectedProviderModel)
                  ?.name || selectedProviderModel}
              </span>
            </div>
          )}
          
          {/* 提示信息 */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isImageGenerationModel
              ? `💡 使用 [图像尺寸]${isDallE3Model ? '、[图像质量]、[图像风格]' : ''} 可自定义参数`
              : "💡 @ 切换模型 | # 使用模板 | / 查看命令 | Enter 发送"}
          </div>
        </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput; 