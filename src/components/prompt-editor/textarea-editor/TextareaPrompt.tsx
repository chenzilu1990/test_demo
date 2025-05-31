import { ChangeEvent, useRef, useEffect } from 'react';
import { SelectedOption } from '../types';

interface TextareaPromptProps {
  value: string;
  onChange: (value: string) => void;
  selectedOptions: SelectedOption[];
  onSelectedOptionsChange: (options: SelectedOption[]) => void;
  placeholder?: string;
  height?: string;
  computeTextDiff: (oldText: string, newText: string) => Map<number, number>;
}

export default function TextareaPrompt({
  value,
  onChange,
  selectedOptions,
  onSelectedOptionsChange,
  placeholder = "在这里输入您的问题或指令...",
  height = "12rem",
  computeTextDiff
}: TextareaPromptProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevValueRef = useRef<string>(value);
  
  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);
  
  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const oldText = prevValueRef.current;
    const newText = e.target.value;
    
    // 只有当文本真正改变时才进行处理
    if (oldText !== newText) {
      // 计算文本变化映射
      const offsetMap = computeTextDiff(oldText, newText);
      
      // 更新选中的选项位置
      const updatedOptions = selectedOptions
        .map(option => {
          const startPos = offsetMap.get(option.position.start);
          const endPos = offsetMap.get(option.position.end);
          
          // 如果能够找到映射位置，则更新选项
          if (startPos !== undefined && startPos !== -1 && 
              endPos !== undefined && endPos !== -1) {
            // 验证映射后的位置是否合理
            if (startPos < endPos && 
                startPos >= 0 && 
                endPos <= newText.length) {
              const newContent = newText.substring(startPos, endPos);
              // 如果内容完全匹配，保持选中状态
              if (newContent === option.selectedValue) {
                return {
                  ...option,
                  position: {
                    start: startPos,
                    end: endPos
                  }
                };
              } 
              // 如果内容部分匹配，也可以考虑保留
              else if (newContent.length > 0 && 
                      (newContent.includes(option.selectedValue) || 
                       option.selectedValue.includes(newContent))) {
                return {
                  ...option,
                  position: {
                    start: startPos,
                    end: endPos
                  },
                  selectedValue: newContent
                };
              }
            }
          }
          // 如果无法映射或映射不合理，则忽略此选项
          return null;
        })
        .filter((option): option is SelectedOption => option !== null);
      
      onSelectedOptionsChange(updatedOptions);
      onChange(newText);
      prevValueRef.current = newText;
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleTextareaChange}
      className="w-full p-3 border rounded-md resize-none dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      placeholder={placeholder}
      style={{ height }}
    />
  );
}
