import { ReactNode } from 'react';
import { SelectedOption } from '../types';

interface InteractiveContentProps {
  value: string;
  selectedOptions: SelectedOption[];
  brackets: Array<{content: string, start: number, end: number}>;
  onBracketClick: (bracketContent: string, startPos: number, endPos: number) => void;
  onSelectedOptionClick: (selectedOption: SelectedOption) => void;
}

export default function InteractiveContent({
  value,
  selectedOptions,
  brackets,
  onBracketClick,
  onSelectedOptionClick
}: InteractiveContentProps) {
  // 处理两种元素：原始方括号和已选择的值
  let lastIndex = 0;
  const elements = [];
  
  // 获取所有需要处理的位置点（包括方括号和已选择的值）
  const allPositions = [
    ...brackets.map(b => ({ 
      isBracket: true, 
      start: b.start, 
      end: b.end, 
      content: b.content,
      id: null // 原始方括号没有ID
    })),
    ...selectedOptions.map(so => ({ 
      isBracket: false, 
      start: so.position.start, 
      end: so.position.end, 
      content: so.selectedValue,
      originalBracket: so.originalBracket,
      type: so.type,
      id: so.id // 使用选项ID
    }))
  ].sort((a, b) => a.start - b.start);
  
  for (let i = 0; i < allPositions.length; i++) {
    const pos = allPositions[i];
    
    // 如果当前元素与前一个元素重叠，跳过
    if (i > 0 && pos.start < allPositions[i-1].end) continue;
    
    // 添加当前元素前的常规文本
    if (pos.start > lastIndex) {
      elements.push(
        <span key={`text-${i}-${lastIndex}`}>{value.substring(lastIndex, pos.start)}</span>
      );
    }
    
    if (pos.isBracket) {
      // 渲染方括号元素
      elements.push(
        <span 
          key={`bracket-${i}`}
          className="text-blue-500 font-medium cursor-pointer hover:bg-blue-100 rounded"
          onClick={() => onBracketClick(pos.content, pos.start, pos.end)}
        >
          [{pos.content}]
        </span>
      );
    } else {
      // 渲染已选择的值 - 使用ID查找
      const selectedOpt = selectedOptions.find(so => so.id === pos.id);
      
      if (selectedOpt) {
        elements.push(
          <span 
            key={`selected-${selectedOpt.id}`}
            className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded cursor-pointer hover:bg-green-200 dark:hover:bg-green-700"
            onClick={() => onSelectedOptionClick(selectedOpt)}
            title={`点击重新选择${selectedOpt.type}`}
          >
            {selectedOpt.selectedValue}
          </span>
        );
      }
    }
    
    lastIndex = pos.end;
  }
  
  // 添加最后一部分文本
  if (lastIndex < value.length) {
    elements.push(
      <span key="text-last">{value.substring(lastIndex)}</span>
    );
  }
  
  return <>{elements}</>;
}
