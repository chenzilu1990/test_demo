"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import PromptEditor, { PromptTemplate, BracketParameterOptions, PromptTemplateFeature, UnifiedComboboxFeature, MentionNode, RegexBlockNode, PromptTemplateNode, KeyboardPlugin } from '@/components/default-prompt-editor';
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
  
  // Keyboard event props
  onEnterPress?: (event: KeyboardEvent) => void;
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
  useContentEditable = false,
  onEnterPress
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

  const getAllParameterOptions = (promptTemplates: PromptTemplate[]): Record<string, string[]> => {
    return promptTemplates.reduce((acc, template) => {
      return {
        ...acc,
        ...(template.parameterOptions || {})
      };
    }, {});
  };

  const handleChange = useCallback((newContent: any) => {
    const text = typeof newContent === 'string' ? newContent : newContent.text;
    onChange(text);
  }, [onChange]);


  return (
    <div className={`relative ${className}`}>
      <PromptEditor
        value={value}
        onChange={handleChange}
        placeholder=""
        style={{
          minHeight: "200px",
          padding: "12px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          backgroundColor: "white",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
        className="dark:bg-gray-900 dark:border-gray-700"
        editorConfig={{
          nodes: [PromptTemplateNode, MentionNode, RegexBlockNode],
        }}
      >
        {/* Base plugins for node support */}
        <PromptTemplateFeature
          parameterOptions={getAllParameterOptions(templates)}
        />

        <UnifiedComboboxFeature
          mentionOptions={availableModels}
          onSelectMention={(mention) => {
            onModelSelect?.(mention.id);
          }}

          templateOptions={templates.map((template) => ({
            id: template.title || "default",
            name: template.title || "default",
            template: template.prompt
          }))}
          onSelectTemplate={(template) => {
            // Insert the selected template into the editor
            onChange(template.template);
          }}

          commandOptions={[
            { id: "1", command: "translate", description: "翻译" },
            { id: "2", command: "summarize", description: "总结" },
            { id: "3", command: "explain", description: "解释" },
            { id: "4", command: "generate", description: "生成" },
            { id: "5", command: "rewrite", description: "重写" },
            { id: "6", command: "proofread", description: "校对" },
            { id: "7", command: "improve", description: "改进" },
            { id: "8", command: "clear message", description: "清除消息" },
            { id: "9", command: "clear context", description: "清除上下文" },
          ]}
          onSelectCommand={(command) => {
            // Handle command selection if needed
            console.log("Selected command:", command);
          }}
        />
        
        <KeyboardPlugin onEnterPress={onEnterPress} />
      </PromptEditor>
    </div>
  );
}

