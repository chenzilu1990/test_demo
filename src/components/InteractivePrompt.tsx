"use client";

import { useState, useRef, ReactNode } from "react";

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

// 组件属性接口
export interface InteractivePromptProps {
  value: string;
  onChange: (value: string) => void;
  templates?: PromptTemplate[];
  bracketOptions: Record<string, BracketOption>;
  placeholder?: string;
  height?: string;
  className?: string;
}

export default function InteractivePrompt({
  value,
  onChange,
  templates = [],
  bracketOptions,
  placeholder = "在这里输入您的问题或指令...",
  height = "12rem",
  className = ""
}: InteractivePromptProps) {
  const [isShowingOptions, setIsShowingOptions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [currentBracket, setCurrentBracket] = useState<{
    type: string;
    position: {start: number; end: number};
    options: string[];
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  };

  // 清空提示词
  const clearPrompt = () => {
    onChange("");
  };
  
  // 处理方括号点击
  const handleBracketClick = (bracketContent: string, startPos: number, endPos: number) => {
    if (bracketOptions[bracketContent]) {
      setCurrentBracket({
        type: bracketOptions[bracketContent].type,
        position: {start: startPos, end: endPos},
        options: bracketOptions[bracketContent].options
      });
      setIsShowingOptions(true);
    }
  };
  
  // 处理选项选择
  const handleOptionSelect = (option: string) => {
    if (currentBracket) {
      const { start, end } = currentBracket.position;
      const newPrompt = value.substring(0, start) + 
                     option + 
                     value.substring(end);
      onChange(newPrompt);
      setIsShowingOptions(false);
      setCurrentBracket(null);
      
      // 设置焦点回文本框
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  // 渲染交互式提示词
  const renderInteractivePrompt = (): ReactNode => {
    const brackets = parseBrackets(value);
    if (brackets.length === 0) return value;
    
    let lastIndex = 0;
    const elements = [];
    
    brackets.forEach((bracket, index) => {
      // 添加方括号前的文本
      if (bracket.start > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>{value.substring(lastIndex, bracket.start)}</span>
        );
      }
      
      // 添加可点击的方括号
      elements.push(
        <span 
          key={`bracket-${index}`}
          className="text-blue-500 font-medium cursor-pointer hover:bg-blue-100 px-1 rounded"
          onClick={() => handleBracketClick(bracket.content, bracket.start, bracket.end)}
        >
          [{bracket.content}]
        </span>
      );
      
      lastIndex = bracket.end;
    });
    
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
      
      {/* 交互式预览区域 */}
      <div className="relative">
        <div className="w-full p-3 border rounded-md mb-2 min-h-16 break-words dark:bg-gray-700 dark:border-gray-600">
          {renderInteractivePrompt()}
        </div>
        
        {/* 实际文本框 */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 border rounded-md resize-none dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder={placeholder}
          style={{ height }}
        />
        
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
        <p>提示：点击蓝色的[方括号]内容可以打开选项面板快速填写。</p>
      </div>
    </div>
  );
} 