"use client";

import { useState, useRef, ReactNode, KeyboardEvent, useEffect } from "react";

// 提示词模板接口
export interface PromptTemplate {
  name: string;
  template: string;
}

// 方括号选项接口
export interface BracketOption {
  type: string;
  options: string[];
}

// 追踪已选择的选项信息
interface SelectedOption {
  type: string;
  originalBracket: string; // 原始方括号内容，如 "[国家]"
  selectedValue: string;   // 已选择的值，如 "中国"
  position: {start: number; end: number};
}

// 组件属性接口
export interface InteractivePromptProps {
  value: string;
  onChange: (value: string) => void;
  templates?: PromptTemplate[];
  bracketOptions: Record<string, BracketOption>;
  placeholder?: string;
  height?: string;
  className?: string;
  useContentEditable?: boolean; // 是否使用contenteditable替代传统文本框
}

export default function InteractivePrompt({
  value,
  onChange,
  templates = [],
  bracketOptions,
  placeholder = "在这里输入您的问题或指令...",
  height = "12rem",
  className = "",
  useContentEditable = false
}: InteractivePromptProps) {
  const [isShowingOptions, setIsShowingOptions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [currentBracket, setCurrentBracket] = useState<{
    type: string;
    position: {start: number; end: number};
    options: string[];
    originalContent?: string; // 保存原始方括号内容
  } | null>(null);
  // 跟踪所有已选择的选项
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  
  // 跟踪光标位置（用于contenteditable模式）
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);

  // 添加用于存储上一个值的引用
  const prevValueRef = useRef<string>(value);

  // 保存选择范围
  const saveSelection = () => {
    if (document.getSelection && useContentEditable) {
      const selection = document.getSelection();
      if (selection && selection.rangeCount > 0) {
        setSelectionRange(selection.getRangeAt(0).cloneRange());
      }
    }
  };

  // 恢复选择范围
  const restoreSelection = () => {
    if (selectionRange && useContentEditable && editableRef.current) {
      const selection = document.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(selectionRange);
      }
    }
  };

  // 解析提示词中的方括号内容
  const parseBrackets = (text: string) => {
    const regex = /\[(.*?)\]/g;
    let match;
    const brackets = [];
    
    while ((match = regex.exec(text)) !== null) {
      brackets.push({
        content: match[1],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    return brackets;
  };

  // 应用模板
  const applyTemplate = (template: string): void => {
    onChange(template);
    setSelectedTemplate("");
    // 当应用新模板时清空已选项跟踪
    setSelectedOptions([]);
  };

  // 清空提示词
  const clearPrompt = () => {
    onChange("");
    setSelectedOptions([]);
    if (useContentEditable && editableRef.current) {
      editableRef.current.focus();
    } else if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // 处理方括号点击
  const handleBracketClick = (bracketContent: string, startPos: number, endPos: number) => {
    if (bracketOptions[bracketContent]) {
      setCurrentBracket({
        type: bracketOptions[bracketContent].type,
        position: {start: startPos, end: endPos},
        options: bracketOptions[bracketContent].options,
        originalContent: bracketContent
      });
      setIsShowingOptions(true);
    }
  };

  // 处理已选择选项的点击
  const handleSelectedOptionClick = (selectedOption: SelectedOption) => {
    // 此处的bracketKey是方括号内的内容，如 "国家"
    const bracketKey = selectedOption.originalBracket.slice(1, -1);
    
    if (bracketOptions[bracketKey]) {
      // 打开选项面板，重新选择
      setCurrentBracket({
        type: bracketOptions[bracketKey].type,
        position: selectedOption.position,
        options: bracketOptions[bracketKey].options,
        originalContent: bracketKey
      });
      setIsShowingOptions(true);
    }
  };
  
  // 处理选项选择
  const handleOptionSelect = (option: string) => {
    if (currentBracket) {
      const { start, end } = currentBracket.position;
      const originalBracket = currentBracket.originalContent ? 
        `[${currentBracket.originalContent}]` : 
        value.substring(start, end);
      
      const newPrompt = value.substring(0, start) + 
                     option + 
                     value.substring(end);
      
      // 更新已选择选项列表
      const updatedOptions = selectedOptions.filter(
        item => !(item.position.start === start && item.position.end === end)
      );
      
      updatedOptions.push({
        type: currentBracket.type,
        originalBracket: originalBracket,
        selectedValue: option,
        position: {
          start: start,
          end: start + option.length
        }
      });
      
      setSelectedOptions(updatedOptions);
      onChange(newPrompt);
      setIsShowingOptions(false);
      setCurrentBracket(null);
      
      // 设置焦点回输入区域
      if (useContentEditable && editableRef.current) {
        setTimeout(() => {
          editableRef.current?.focus();
        }, 0);
      } else if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  // 计算两个字符串的最长公共子序列
  const findCommonSubstrings = (oldText: string, newText: string) => {
    // 创建一个二维数组来存储最长公共子序列的长度
    const dp: number[][] = Array(oldText.length + 1)
      .fill(0)
      .map(() => Array(newText.length + 1).fill(0));
    
    // 计算最长公共子序列
    for (let i = 1; i <= oldText.length; i++) {
      for (let j = 1; j <= newText.length; j++) {
        if (oldText[i - 1] === newText[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    // 提取公共子串和它们在文本中的位置
    const commonSubstrings: { 
      text: string; 
      oldIndex: number; 
      newIndex: number;
      length: number;
    }[] = [];
    
    let i = oldText.length, j = newText.length;
    while (i > 0 && j > 0) {
      if (oldText[i - 1] === newText[j - 1]) {
        // 找到匹配字符，向前尝试找最长的匹配子串
        let subStart = i - 1;
        let matchLength = 1;
        let k = 1;
        
        while (subStart - k >= 0 && j - k - 1 >= 0 && 
               oldText[subStart - k] === newText[j - k - 1]) {
          matchLength++;
          k++;
        }
        
        // 记录找到的子串
        const substringText = oldText.substring(subStart - matchLength + 1, subStart + 1);
        commonSubstrings.unshift({
          text: substringText,
          oldIndex: subStart - matchLength + 1,
          newIndex: j - matchLength,
          length: matchLength
        });
        
        // 回溯
        i -= matchLength;
        j -= matchLength;
      } else if (dp[i][j - 1] > dp[i - 1][j]) {
        j--;
      } else {
        i--;
      }
    }
    
    // 合并相邻或接近的子串
    const mergedSubstrings: typeof commonSubstrings = [];
    for (let i = 0; i < commonSubstrings.length; i++) {
      const current = commonSubstrings[i];
      if (i === 0 || 
          (current.oldIndex - (commonSubstrings[i-1].oldIndex + commonSubstrings[i-1].length) > 3) ||
          (current.newIndex - (commonSubstrings[i-1].newIndex + commonSubstrings[i-1].length) > 3)) {
        mergedSubstrings.push(current);
      } else {
        // 合并相邻子串
        const prev = mergedSubstrings.pop()!;
        const gap = current.oldIndex - (prev.oldIndex + prev.length);
        const mergedText = prev.text + oldText.substring(prev.oldIndex + prev.length, current.oldIndex + current.length);
        mergedSubstrings.push({
          text: mergedText,
          oldIndex: prev.oldIndex,
          newIndex: prev.newIndex,
          length: prev.length + gap + current.length
        });
      }
    }
    
    return mergedSubstrings;
  };
  
  // 计算两个文本之间的差异
  const computeTextDiff = (oldText: string, newText: string) => {
    const commonParts = findCommonSubstrings(oldText, newText);
    
    // 创建修改映射表
    const offsetMap = new Map<number, number>();
    
    // 初始化所有旧位置的映射
    for (let i = 0; i <= oldText.length; i++) {
      offsetMap.set(i, -1); // -1表示这个位置在新文本中可能已被删除
    }
    
    // 使用找到的公共部分来建立位置映射
    commonParts.forEach(part => {
      // 对公共部分中的每个位置建立映射
      for (let i = 0; i < part.length; i++) {
        offsetMap.set(part.oldIndex + i, part.newIndex + i);
      }
    });
    
    // 计算不在公共部分中的旧位置的映射
    let lastMappedOldPos = -1;
    let lastMappedNewPos = -1;
    
    for (let i = 0; i <= oldText.length; i++) {
      const mappedPos = offsetMap.get(i);
      if (mappedPos !== -1) {
        // 找到了映射点
        lastMappedOldPos = i;
        lastMappedNewPos = mappedPos;
      } else if (lastMappedOldPos !== -1) {
        // 在两个映射点之间的位置
        // 计算到下一个映射点的距离
        let nextMappedOldPos = -1;
        let nextMappedNewPos = -1;
        
        for (let j = i + 1; j <= oldText.length; j++) {
          const nextPos = offsetMap.get(j);
          if (nextPos !== -1) {
            nextMappedOldPos = j;
            nextMappedNewPos = nextPos;
            break;
          }
        }
        
        if (nextMappedOldPos !== -1) {
          // 使用线性插值来估计此位置的映射
          const progress = (i - lastMappedOldPos) / (nextMappedOldPos - lastMappedOldPos);
          const estimatedPos = Math.round(lastMappedNewPos + progress * (nextMappedNewPos - lastMappedNewPos));
          offsetMap.set(i, estimatedPos);
        } else {
          // 没有下一个映射点，可能是末尾
          offsetMap.set(i, lastMappedNewPos + (i - lastMappedOldPos));
        }
      }
    }
    
    return offsetMap;
  };
  
  // 修改contenteditable的输入变化处理函数
  const handleContentEditableChange = () => {
    if (editableRef.current) {
      const oldText = prevValueRef.current;
      const newText = editableRef.current.innerText;
      
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
                  endPos <= newText.length &&
                  // 确认映射后的内容与原选项值匹配
                  newText.substring(startPos, endPos) === option.selectedValue) {
                return {
                  ...option,
                  position: {
                    start: startPos,
                    end: endPos
                  }
                };
              }
            }
            // 如果无法映射或映射不合理，则忽略此选项
            return null;
          })
          .filter((option): option is SelectedOption => option !== null);
        
        setSelectedOptions(updatedOptions);
        onChange(newText);
        prevValueRef.current = newText;
      }
    }
  };
  
  // 监听value的变化，更新prevValueRef
  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);
  
  // 处理textarea的输入变化
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
                endPos <= newText.length &&
                // 确认映射后的内容与原选项值匹配
                newText.substring(startPos, endPos) === option.selectedValue) {
              return {
                ...option,
                position: {
                  start: startPos,
                  end: endPos
                }
              };
            }
          }
          // 如果无法映射或映射不合理，则忽略此选项
          return null;
        })
        .filter((option): option is SelectedOption => option !== null);
      
      setSelectedOptions(updatedOptions);
      onChange(newText);
      prevValueRef.current = newText;
    }
  };
  
  // 处理contenteditable的键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // 如果按下Tab键，添加制表符而不是切换焦点
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '\t');
    }
    
    saveSelection();
  };

  // 渲染交互式提示词
  const renderInteractivePrompt = (): ReactNode => {
    const brackets = parseBrackets(value);
    // 处理两种元素：原始方括号和已选择的值
    let lastIndex = 0;
    const elements = [];
    
    // 获取所有需要处理的位置点（包括方括号和已选择的值）
    const allPositions = [
      ...brackets.map(b => ({ 
        isBracket: true, 
        start: b.start, 
        end: b.end, 
        content: b.content 
      })),
      ...selectedOptions.map(so => ({ 
        isBracket: false, 
        start: so.position.start, 
        end: so.position.end, 
        content: so.selectedValue,
        originalBracket: so.originalBracket,
        type: so.type
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
            className="text-blue-500 font-medium cursor-pointer hover:bg-blue-100 px-1 rounded"
            onClick={() => handleBracketClick(pos.content, pos.start, pos.end)}
          >
            [{pos.content}]
          </span>
        );
      } else {
        // 渲染已选择的值
        const selectedOpt = selectedOptions.find(
          so => so.position.start === pos.start && so.position.end === pos.end
        );
        
        if (selectedOpt) {
          elements.push(
            <span 
              key={`selected-${i}`}
              className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 px-1 rounded cursor-pointer hover:bg-green-200 dark:hover:bg-green-700"
              onClick={() => handleSelectedOptionClick(selectedOpt)}
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
    
    return elements;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 字符计数和模板选择 */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">{value.length} 个字符</div>
        
        {templates.length > 0 && (
          <select
            value={selectedTemplate}
            onChange={(e) => {
              const selected = e.target.value;
              if (selected) {
                const template = templates.find(t => t.name === selected);
                if (template) applyTemplate(template.template);
              }
              setSelectedTemplate(selected);
            }}
            className="text-sm p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">选择模板...</option>
            {templates.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        )}
      </div>
      
      {/* 交互式编辑区域 */}
      <div className="relative">
        {useContentEditable ? (
          // 可编辑的交互式区域
          <div
            ref={editableRef}
            contentEditable
            onInput={handleContentEditableChange}
            onKeyDown={handleKeyDown}
            onBlur={saveSelection}
            onFocus={restoreSelection}
            className="w-full p-3 border rounded-md break-words dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 overflow-auto"
            style={{ minHeight: "3rem", height, whiteSpace: "pre-wrap" }}
            data-placeholder={placeholder}
            suppressContentEditableWarning
          >
            {renderInteractivePrompt()}
          </div>
        ) : (
          <>
            {/* 传统模式：预览区域 + 文本框 */}
            <div className="w-full p-3 border rounded-md mb-2 min-h-16 break-words dark:bg-gray-700 dark:border-gray-600">
              {renderInteractivePrompt()}
            </div>
            
            {/* 实际文本框 - 注意这里修改了onChange处理函数 */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleTextareaChange}
              className="w-full p-3 border rounded-md resize-none dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder={placeholder}
              style={{ height }}
            />
          </>
        )}
        
        {/* 选项弹窗 */}
        {isShowingOptions && currentBracket && (
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-10">
            <div className="p-2 border-b dark:border-gray-700">
              <span className="font-medium">请选择{currentBracket.type}</span>
              <button 
                className="float-right text-gray-500 hover:text-gray-700"
                onClick={() => setIsShowingOptions(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-2 max-h-60 overflow-y-auto">
              {currentBracket.options.map((option, idx) => (
                <div 
                  key={idx}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
                  onClick={() => handleOptionSelect(option)}
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 操作按钮 */}
        <div className="absolute bottom-3 right-3 flex space-x-2">
          <button
            type="button"
            onClick={clearPrompt}
            className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-xs"
            title="清空提示词"
          >
            清空
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        <p>提示：点击蓝色的[方括号]内容可以选择选项，点击绿色高亮的已选项可以重新选择。</p>
      </div>
      
      {/* 添加用于显示空占位符的样式 */}
      <style jsx global>{`
        [contenteditable="true"]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          cursor: text;
        }
      `}</style>
    </div>
  );
} 