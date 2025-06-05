import { useState, useRef, useEffect } from 'react';
// import { BracketParameterOptions } from './types';

interface OptionPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onOptionSelect: (option: string) => void;
  options: string[];
  type: string;
  parameterName?: string; // 参数名称，用于LLM生成相关选项
  onGenerateMoreOptions?: (paramName: string, currentOptions: string[]) => Promise<string[]>; // 生成更多选项的回调
  onOptionsUpdated?: (paramName: string, updatedOptions: string[]) => void; // 新增：选项更新回调
}

export default function OptionPanel({
  isVisible,
  onClose,
  onOptionSelect,
  options: initialOptions,
  type,
  parameterName,
  onGenerateMoreOptions,
  onOptionsUpdated
}: OptionPanelProps) {
  const [options, setOptions] = useState<string[]>(initialOptions);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const optionsContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(false);

  // 更新选项列表当初始选项变化时
  useEffect(() => {
    setOptions(initialOptions);
  }, [initialOptions]);

  // 检测滚动到底部
  const handleScroll = () => {
    if (!optionsContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = optionsContainerRef.current;
    // 当滚动到距离底部20px或更近时，视为接近底部
    const isNear = scrollHeight - scrollTop - clientHeight < 20;
    setIsNearBottom(isNear);
  };

  // 生成更多选项
  const handleGenerateMore = async () => {
    if (!onGenerateMoreOptions || !parameterName || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const newOptions = await onGenerateMoreOptions(parameterName, options);
      // 过滤掉已有选项，只添加新的选项
      const uniqueNewOptions = newOptions.filter(opt => !options.includes(opt));
      if (uniqueNewOptions.length > 0) {
        const updatedOptions = [...options, ...uniqueNewOptions];
        setOptions(updatedOptions);
        
        // 通知父组件选项已更新
        if (onOptionsUpdated && parameterName) {
          onOptionsUpdated(parameterName, updatedOptions);
        }
      } else {
        setError("未找到新的选项");
      }
    } catch (err: any) {
      setError(err.message || "生成选项失败");
      console.error("生成选项错误:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isVisible) return null;
  
  return (
    <div className="option-panel absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-10">
      <div className="p-2 border-b dark:border-gray-700">
        <span className="font-medium">请选择{type}</span>
        <button 
          className="float-right text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div 
        ref={optionsContainerRef}
        className="p-2 max-h-60 overflow-y-auto"
        onScroll={handleScroll}
      >
        {options.map((option, idx) => (
          <div 
            key={`${option}-${idx}`}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
            onClick={() => onOptionSelect(option)}
          >
            {option}
          </div>
        ))}
        
        {/* 生成更多选项区域 */}
        {onGenerateMoreOptions && parameterName && (
          <div className="mt-2 pt-2 border-t dark:border-gray-700">
            {options.length === 0 && !isGenerating && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-2">
                当前参数 "{parameterName}" 没有预设选项，请尝试生成。
              </p>
            )}
            {error && (
              <div className="text-xs text-red-500 mb-2 px-2">
                {error}
              </div>
            )}
            <button
              className={`w-full p-2 text-center rounded ${
                isGenerating 
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-wait' 
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              }`}
              onClick={handleGenerateMore}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </span>
              ) : (
                options.length === 0 ? `为 "${parameterName}" 生成选项` : `${isNearBottom ? '找不到合适的选项？' : ''} 生成更多选项`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
