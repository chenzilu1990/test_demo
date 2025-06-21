"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import PromptEditor, { 
  PromptTemplate, 
  BracketParameterOptions,
  PromptTemplateFeature,
  PromptTemplateNode,
  MentionFeature,
  MentionNode,
  ComboboxPlugin
} from '@/components/default-prompt-editor';
import { ModelOption } from './types';

interface PromptEditorWrapperProps {
  value: string;
  onChange: (value: string) => void;
  templates?: PromptTemplate[];
  bracketOptions: BracketParameterOptions;
  placeholder?: string;
  height?: string;
  className?: string;
  paramTemplate?: PromptTemplate;
  onGenerateMoreOptions?: (paramName: string, currentOptions: string[]) => Promise<string[]>;
  onClear?: () => void;
  onBracketOptionsUpdate?: (updatedOptions: BracketParameterOptions) => void;
  
  // Model selector props
  availableModels?: ModelOption[];
  selectedProviderModel?: string;
  onModelSelect?: (modelId: string) => void;
  isImageGenerationModel?: boolean;
  onNavigateToProviders?: () => void;
  onNavigateToTemplateSettings?: () => void;
  
  // Additional props that might be used
  useContentEditable?: boolean;
}

export default function PromptEditorWrapper({
  value,
  onChange,
  templates = [],
  bracketOptions,
  placeholder = "输入您的问题或指令...",
  height = "8rem",
  className = "",
  paramTemplate,
  onGenerateMoreOptions,
  onClear,
  onBracketOptionsUpdate,
  availableModels = [],
  selectedProviderModel = "",
  onModelSelect,
  isImageGenerationModel = false,
  onNavigateToProviders,
  onNavigateToTemplateSettings,
  useContentEditable = false
}: PromptEditorWrapperProps) {
  const [localBracketOptions, setLocalBracketOptions] = useState<BracketParameterOptions>(bracketOptions);
  const editorRef = useRef<any>(null);
  const [prompt, setPrompt] = useState(
    "我的目标市场是{国家}，目标用户是[性别]，目标[年龄段]，品类是[产品或品类]，产品优势是[产品优势或卖点]请帮我做目标用户画像分析"
  );

  // Initialize with paramTemplate if provided
  useEffect(() => {
    if (paramTemplate && !value) {
      onChange(paramTemplate.prompt);
    }
  }, [paramTemplate, value, onChange]);

  // Merge template options with bracket options
  const mergedOptions = React.useMemo(() => {
    if (!paramTemplate) return localBracketOptions;
    
    return {
      ...localBracketOptions,
      ...(paramTemplate.parameterOptions || {})
    };
  }, [localBracketOptions, paramTemplate]);

  // Handle editor change
  const handleChange = useCallback((content: any) => {
    const text = typeof content === 'string' ? content : content.text;
    onChange(text);
  }, [onChange]);

  // Handle clear
  const handleClear = useCallback(() => {
    onChange('');
    if (editorRef.current) {
      editorRef.current.clear?.();
    }
    onClear?.();
  }, [onChange, onClear]);

  // Handle option selection
  const handleSelectOption = useCallback((parameterName: string, selectedValue: string) => {
    console.log(`Selected ${selectedValue} for ${parameterName}`);
    
    // If onBracketOptionsUpdate is provided, we might want to update the options
    // This is a simplified implementation - the original might have more complex logic
  }, []);

  return (
    <div className={`relative ${className}`}>
      <PromptEditor
        ref={editorRef}
        value={prompt}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          minHeight: height,
          padding: "12px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          backgroundColor: "white",
          fontSize: "14px",
          lineHeight: "1.5",
          fontFamily: "inherit",
          resize: "vertical",
          overflow: "auto",
        }}
        className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
        editorConfig={{
          nodes: [PromptTemplateNode, MentionNode],
        }}
      >
        <PromptTemplateFeature
          parameterOptions={{
            国家: ["美国", "中国", "日本", "韩国", "英国", "法国", "德国"],
            性别: ["男性", "女性", "不限"],
            年龄段: ["18-25岁", "26-35岁", "36-45岁", "46-55岁", "56岁以上"],
            产品或品类: [
              "电子产品",
              "服装鞋帽",
              "美妆护肤",
              "食品饮料",
              "家居用品",
              "运动户外",
            ],
            产品优势或卖点: [
              "高性价比",
              "品质卓越",
              "创新设计",
              "环保可持续",
              "便捷实用",
              "个性定制",
            ],
          }}
          onSelectOption={(param, value) => {
            console.log(`Selected ${param}: ${value}`);
          }}
        />
        <MentionFeature mentionOptions={[]} onSelectMention={() => {}} />
        <ComboboxPlugin
          triggers={[
            {
              trigger: "@",
              options: [
                {
                  id: "1",
                  label: "@123",
                  value: "@123"
                }
              ],
              onSelect: () => {}
            }
          ]}
        />
      </PromptEditor>

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="Clear"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Template selector hint */}
      {templates && templates.length > 0 && (
        <div className="absolute left-2 bottom-2 text-xs text-gray-400 dark:text-gray-500">
          {templates.length} 个模板可用
        </div>
      )}

      {/* Model indicator */}
      {selectedProviderModel && availableModels.length > 0 && (
        <div className="absolute right-2 bottom-2 text-xs text-gray-400 dark:text-gray-500">
          {availableModels.find((m) => m.id === selectedProviderModel)?.name ||
            selectedProviderModel}
        </div>
      )}
    </div>
  );
}

