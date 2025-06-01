import React from 'react';
import InteractivePrompt from '@/components/prompt-editor/InteractivePrompt';
import { BracketOption } from '@/components/prompt-editor/types';
import { PromptTemplateWithOptions } from './types';

interface ChatInputProps {
  inputPrompt: string;
  setInputPrompt: (value: string) => void;
  bracketOptions: Record<string, BracketOption>;
  isImageGenerationModel: boolean;
  isDallE3Model: boolean;
  isLoading: boolean;
  selectedProviderModel: string;
  handleSendMessage: () => void;
  activeParamTemplate?: PromptTemplateWithOptions;
  onGenerateMoreOptions?: (paramName: string, currentOptions: string[]) => Promise<string[]>;
  clearActiveTemplate?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
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
  const handleInputChange = (value: string) => {
    setInputPrompt(value);
    if (value === '' && clearActiveTemplate && activeParamTemplate) {
      clearActiveTemplate();
    }
  };

  const handleClear = () => {
    setInputPrompt('');
    if (clearActiveTemplate) {
      clearActiveTemplate();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
      <div className="container mx-auto">
        <InteractivePrompt
          value={inputPrompt}
          onChange={handleInputChange}
          bracketOptions={bracketOptions}
          placeholder={
            isImageGenerationModel
              ? "描述您想要生成的图像..."
              : "输入您的问题或指令..."
          }
          height="8rem"
          paramTemplate={activeParamTemplate}
          onGenerateMoreOptions={onGenerateMoreOptions}
          onClear={handleClear}
        />

        <div className="mt-2 flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isImageGenerationModel && (
              <p>
                提示：可以使用 [图像尺寸]
                {isDallE3Model && ', [图像质量], [图像风格]'}
                来设置参数
              </p>
            )}
            {!isImageGenerationModel && (
              <p>提示：可以使用 [温度]、[最大令牌] 来调整参数</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-full font-medium border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              清空
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!inputPrompt.trim() || !selectedProviderModel || isLoading}
              className={`px-4 py-2 rounded-full font-medium ${
                !inputPrompt.trim() || !selectedProviderModel || isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isLoading ? '处理中...' : isImageGenerationModel ? '生成图像' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput; 