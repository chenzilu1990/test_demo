import React, { memo, useCallback } from 'react';
import InteractivePrompt from '@/components/prompt-editor/InteractivePrompt';
import { PromptTemplate,BracketParameterOptions } from "@/components/prompt-editor/types";

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
  clearActiveTemplate
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
    ? `提示：可以使用 [图像尺寸]${isDallE3Model ? ', [图像质量], [图像风格]' : ''} 来设置参数`
    : "提示：可以使用 [温度]、[最大令牌] 来调整参数";

  const buttonDisabled = !inputPrompt.trim() || !selectedProviderModel || isLoading;
  const buttonText = isLoading ? '处理中...' : isImageGenerationModel ? '生成图像' : '发送';

  return (
    <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
      <div className="container mx-auto">
        <InteractivePrompt
          value={inputPrompt}
          onChange={handleInputChange}
          bracketOptions={bracketOptions}
          placeholder={placeholder}
          height="8rem"
          paramTemplate={activeParamTemplate}
          onGenerateMoreOptions={onGenerateMoreOptions}
          onClear={handleClear}
        />

        <div className="mt-2 flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>{hintText}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-full font-medium border border-gray-300 text-gray-600 hover:bg-gray-100"
              aria-label="清空输入"
            >
              清空
            </button>
            <button
              onClick={handleSendMessage}
              disabled={buttonDisabled}
              className={`px-4 py-2 rounded-full font-medium ${
                buttonDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              aria-label={buttonText}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput; 