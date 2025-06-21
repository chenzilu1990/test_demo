"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import PromptEditor, { 
  PromptTemplate, 
  BracketParameterOptions,
  PromptTemplateFeature,
  PromptTemplateNode
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
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          minHeight: height,
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: 'white',
          fontSize: '14px',
          lineHeight: '1.5',
          fontFamily: 'inherit',
          resize: 'vertical',
          overflow: 'auto'
        }}
        className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
        editorConfig={{
          nodes: [PromptTemplateNode],
        }}
      >
        <PromptTemplateFeature 
          parameterOptions={mergedOptions}
          onSelectOption={handleSelectOption}
        />
      </PromptEditor>

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="Clear"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
          {availableModels.find(m => m.id === selectedProviderModel)?.name || selectedProviderModel}
        </div>
      )}
    </div>
  );
}