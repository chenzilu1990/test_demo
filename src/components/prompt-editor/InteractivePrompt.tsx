"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid'; // 需要安装: npm install uuid @types/uuid
import TemplateSelector from "./TemplateSelector";
import OptionPanel from "./OptionPanel";
import InteractiveContent from "./textarea-editor/InteractiveContent";
import TextareaPrompt from "./textarea-editor/TextareaPrompt";
import OverlayTextareaPrompt from "./textarea-editor/OverlayTextareaPrompt";
import { BracketParameterOptions, PromptTemplate, SelectedOption, BracketFormatConfig, DEFAULT_BRACKET_FORMATS } from "./types";
import { computeTextDiff } from "./textarea-editor/TextDiffUtils";
// import LexicalPromptEditor from "./LexicalPromptEditor";
import LexicalPromptEditor from "./lexical-editor/LexicalPromptEditor";



// 组件属性接口
export interface InteractivePromptProps {
  value: string;
  onChange: (value: string) => void;
  templates?: PromptTemplate[];
  bracketOptions: BracketParameterOptions;
  placeholder?: string;
  height?: string;
  className?: string;
  useContentEditable?: boolean; // 是否使用contenteditable替代传统文本框
  paramTemplate?: PromptTemplate; // 新增参数化模板属性
  onGenerateMoreOptions?: (paramName: string, currentOptions: string[]) => Promise<string[]>; // LLM生成更多选项
  onClear?: () => void; // 新增外部清空回调
  onBracketOptionsUpdate?: (updatedOptions: BracketParameterOptions) => void; // 新增：选项更新回调
  bracketFormats?: BracketFormatConfig[]; // 括号格式配置
}

export default function InteractivePrompt({
  value,
  onChange,
  templates = [],
  bracketOptions: defaultBracketOptions,
  placeholder = "在这里输入您的问题或指令...",
  height = "12rem",
  className = "",
  useContentEditable = false ,
  paramTemplate,
  onGenerateMoreOptions,
  onClear,
  onBracketOptionsUpdate,
  bracketFormats = DEFAULT_BRACKET_FORMATS
}: InteractivePromptProps) {
  const [isShowingOptions, setIsShowingOptions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [currentBracket, setCurrentBracket] = useState<{
    position: {start: number; end: number};
    options: string[];
    type: string;
    originalContent?: string;
    optionId?: string;
  } | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [localBracketOptions, setLocalBracketOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setLocalBracketOptions(defaultBracketOptions);
  }, [defaultBracketOptions]);

  const bracketOptions = useMemo(() => {
    if (!paramTemplate) return localBracketOptions;
    
    const paramOptions: BracketParameterOptions = {};
    
    Object.entries(paramTemplate.parameterOptions || {}).forEach(([param, options]) => {
      paramOptions[param] = options;
    });
    console.log("paramOptions", localBracketOptions, paramOptions);
    return { ...localBracketOptions, ...paramOptions };
  }, [localBracketOptions, paramTemplate]);

  useEffect(() => {
    if (paramTemplate && !value) {
      onChange(typeof paramTemplate.prompt === 'string' ? paramTemplate.prompt : "");
    }
  }, [paramTemplate, value, onChange]);
  
  const handleOptionsUpdated = useCallback((paramName: string, updatedOptions: string[]) => {
    setLocalBracketOptions(prev => {
      const updated = {
        ...prev,
        [paramName]: updatedOptions
      };
      
      if (onBracketOptionsUpdate) {
        onBracketOptionsUpdate(updated);
      }
      
      return updated;
    });
  }, [onBracketOptionsUpdate]);
  
  const parseBrackets = (text: string) => {
    const brackets = [];
    
    const allMatches: Array<{
      content: string;
      start: number;
      end: number;
      type: string;
      fullMatch: string;
      priority: number;
      formatConfig: BracketFormatConfig;
    }> = [];
    
    // 使用配置化的格式匹配
    bracketFormats.forEach((formatConfig) => {
      let match;
      // 重新创建正则表达式以重置lastIndex
      const tempRegex = new RegExp(formatConfig.regex.source, formatConfig.regex.flags);
      while ((match = tempRegex.exec(text)) !== null) {
        allMatches.push({
          content: match[1] || '', // 确保捕获组存在
          start: match.index,
          end: match.index + match[0].length,
          type: formatConfig.type,
          fullMatch: match[0],
          priority: formatConfig.priority,
          formatConfig
        });
      }
    });
    
    // 按位置和优先级排序（位置优先，然后按优先级倒序）
    allMatches.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return b.priority - a.priority; // 优先级高的排前面
    });
    
    for (let i = 0; i < allMatches.length; i++) {
      const current = allMatches[i];
      let isOverlapped = false;
      
      // 检查是否与已添加的匹配项重叠
      for (const existing of brackets) {
        if (!(current.end <= existing.start || current.start >= existing.end)) {
          isOverlapped = true;
          break;
        }
      }
      
      if (!isOverlapped) {
        brackets.push({
          content: current.content,
          start: current.start,
          end: current.end,
          formatConfig: current.formatConfig // 保存格式配置信息
        });
      }
    }
    
    // 最终按位置排序
    return brackets.sort((a, b) => a.start - b.start);
  };

  const handleTemplateSelect = (prompt: string): void => {
    onChange(prompt);
    setSelectedTemplate("");
    setSelectedOptions([]);
  };

  const clearPrompt = () => {
    onChange("");
    setSelectedOptions([]);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    
    if (onClear) {
      onClear();
    }
  };
  
  const handleBracketClick = (bracketContent: string, startPos: number, endPos: number) => {
    if (bracketOptions[bracketContent]) {
      setCurrentBracket({
        position: {start: startPos, end: endPos},
        options: bracketOptions[bracketContent],
        type: bracketContent,
        originalContent: bracketContent
      });
      setIsShowingOptions(true);
    }
  };

  const handleSelectedOptionClick = (selectedOption: SelectedOption) => {
    // 提取括号内的内容，支持 [*], {*}, {{*}} 格式
    let bracketKey = '';
    const bracket = selectedOption.originalBracket;
    
    if (bracket.startsWith('{{') && bracket.endsWith('}}')) {
      bracketKey = bracket.slice(2, -2);
    } else if ((bracket.startsWith('{') && bracket.endsWith('}')) || 
               (bracket.startsWith('[') && bracket.endsWith(']'))) {
      bracketKey = bracket.slice(1, -1);
    }
    
    if (bracketOptions[bracketKey]) {
      setCurrentBracket({
        position: selectedOption.position,
        options: bracketOptions[bracketKey],
        type: bracketKey,
        originalContent: bracketKey,
        optionId: selectedOption.id
      });
      setIsShowingOptions(true);
    }
  };
  
  const handleOptionSelect = (option: string) => {
    if (currentBracket) {
      const { start, end } = currentBracket.position;
      const originalBracket = value.substring(start, end);
      
      const newPrompt = value.substring(0, start) + 
                     option + 
                     value.substring(end);
      
      let updatedOptions: SelectedOption[];
      
      if (currentBracket.optionId) {
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
        updatedOptions = [
          ...selectedOptions,
          {
            id: uuidv4(),
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
      
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };
  
  const brackets = useMemo(() => parseBrackets(value), [value]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {paramTemplate && (
            <span className="mr-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded">
              {paramTemplate.title}
            </span>
          )}
          {value.length} 个字符
        </div>
        
        <TemplateSelector 
          templates={templates} 
          onTemplateSelect={handleTemplateSelect}
          selectedTemplate={selectedTemplate}
        />
      </div>
      
      <div className="relative">
        {useContentEditable ? (
          <LexicalPromptEditor
            value={value}
            onChange={onChange}
            bracketOptions={bracketOptions}
            onGenerateMoreOptions={onGenerateMoreOptions || (async (paramName: string, currentOptions: string[]) => {
              console.warn(`生成更多选项功能未配置，参数: ${paramName}`);
              return [];
            })}
            onBracketOptionsUpdate={onBracketOptionsUpdate}
          />

        ) : (
          <OverlayTextareaPrompt
            value={value}
            onChange={onChange}
            selectedOptions={selectedOptions}
            onSelectedOptionsChange={setSelectedOptions}
            brackets={brackets}
            onBracketClick={handleBracketClick}
            onSelectedOptionClick={handleSelectedOptionClick}
            placeholder={placeholder}
            height={height}
            computeTextDiff={computeTextDiff}
          />
        )}
        
        {currentBracket && (
          <OptionPanel
            isVisible={isShowingOptions}
            onClose={() => setIsShowingOptions(false)}
            onOptionSelect={handleOptionSelect}
            options={currentBracket.options}
            type={currentBracket.type}
            parameterName={currentBracket.originalContent}
            onGenerateMoreOptions={onGenerateMoreOptions}
            onOptionsUpdated={handleOptionsUpdated}
          />
        )}
        
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
        <p>提示：点击蓝色的 {bracketFormats.map(format => format.description).join('、')} 内容可以选择选项，点击绿色高亮的已选项可以重新选择。</p>
      </div>
      
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