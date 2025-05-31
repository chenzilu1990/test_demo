"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid'; // 需要安装: npm install uuid @types/uuid
import TemplateSelector from "./TemplateSelector";
import OptionPanel from "./OptionPanel";
import InteractiveContent from "./textarea-editor/InteractiveContent";
import TextareaPrompt from "./textarea-editor/TextareaPrompt";
import { BracketOption, PromptTemplate, SelectedOption } from "./types";
import { computeTextDiff } from "./textarea-editor/TextDiffUtils";
// import LexicalPromptEditor from "./LexicalPromptEditor";
import LexicalPromptEditor from "./lexical-editor/LexicalPromptEditor";


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
    optionId?: string;       // 如果是编辑已有选项，存储其ID
  } | null>(null);
  // 跟踪所有已选择的选项
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
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
  const handleTemplateSelect = (template: string): void => {
    onChange(template);
    setSelectedTemplate("");
    setSelectedOptions([]);
  };

  // 清空提示词
  const clearPrompt = () => {
    onChange("");
    setSelectedOptions([]);
    if (textareaRef.current) {
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

  // 处理已选择选项的点击 - 使用ID而非位置
  const handleSelectedOptionClick = (selectedOption: SelectedOption) => {
    // 此处的bracketKey是方括号内的内容，如 "国家"
    const bracketKey = selectedOption.originalBracket.slice(1, -1);
    
    if (bracketOptions[bracketKey]) {
      // 打开选项面板，重新选择，并传递现有选项的ID
      setCurrentBracket({
        type: bracketOptions[bracketKey].type,
        position: selectedOption.position,
        options: bracketOptions[bracketKey].options,
        originalContent: bracketKey,
        optionId: selectedOption.id // 保存选项ID用于更新
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
      
      // 更新已选择选项列表 - 使用ID而非位置
      let updatedOptions: SelectedOption[];
      
      if (currentBracket.optionId) {
        // 更新现有选项
        updatedOptions = selectedOptions.map(item => 
          item.id === currentBracket.optionId 
            ? {
                ...item,
                selectedValue: option,
                position: {
                  start: start,
                  end: start + option.length
                }
              } 
            : item
        );
      } else {
        // 添加新选项
        updatedOptions = [
          ...selectedOptions,
          {
            id: uuidv4(), // 生成唯一ID
            type: currentBracket.type,
            originalBracket: originalBracket,
            selectedValue: option,
            position: {
              start: start,
              end: start + option.length
            }
          }
        ];
      }
      
      setSelectedOptions(updatedOptions);
      onChange(newPrompt);
      setIsShowingOptions(false);
      setCurrentBracket(null);
      
      // 设置焦点回输入区域
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };
  
  // 使用useMemo缓存解析后的括号
  const brackets = useMemo(() => parseBrackets(value), [value]);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 字符计数和模板选择 */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">{value.length} 个字符</div>
        
        <TemplateSelector 
          templates={templates} 
          onTemplateSelect={handleTemplateSelect}
          selectedTemplate={selectedTemplate}
        />
      </div>
      
      {/* 交互式编辑区域 */}
      <div className="relative">
        {useContentEditable ? (
          <LexicalPromptEditor
            value={value}
            onChange={onChange}
            bracketOptions={bracketOptions}
          />

        ) : (
          <>
            {/* 传统模式：预览区域 + 文本框 */}
            <div className="w-full p-3 border rounded-md mb-2 min-h-16 break-words dark:bg-gray-700 dark:border-gray-600">
              <InteractiveContent
                value={value}
                selectedOptions={selectedOptions}
                brackets={brackets}
                onBracketClick={handleBracketClick}
                onSelectedOptionClick={handleSelectedOptionClick}
              />
            </div>
            
            <TextareaPrompt
              value={value}
              onChange={onChange}
              selectedOptions={selectedOptions}
              onSelectedOptionsChange={setSelectedOptions}
              placeholder={placeholder}
              height={height}
              computeTextDiff={computeTextDiff}
            />
          </>
        )}
        
        {/* 选项弹窗 */}
        {currentBracket && (
          <OptionPanel
            isVisible={isShowingOptions}
            onClose={() => setIsShowingOptions(false)}
            onOptionSelect={handleOptionSelect}
            options={currentBracket.options}
            type={currentBracket.type}
          />
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