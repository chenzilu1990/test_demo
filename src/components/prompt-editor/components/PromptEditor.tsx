import React, { forwardRef } from 'react';
import OverlayTextareaPrompt from '../textarea-editor/OverlayTextareaPrompt';
import LexicalPromptEditor from '../lexical-editor/LexicalPromptEditor';
import { SelectedOption, BracketFormatConfig } from '../types';
import { computeTextDiff } from '../textarea-editor/TextDiffUtils';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  selectedOptions: SelectedOption[];
  onSelectedOptionsChange: (options: SelectedOption[]) => void;
  brackets: Array<{content: string, start: number, end: number, formatConfig?: BracketFormatConfig}>;
  onBracketClick: (bracketContent: string, startPos: number, endPos: number) => void;
  onSelectedOptionClick: (selectedOption: SelectedOption) => void;
  placeholder?: string;
  height?: string;
  useContentEditable?: boolean;
  bracketOptions: Record<string, string[]>;
  onGenerateMoreOptions?: (paramName: string, currentOptions: string[]) => Promise<string[]>;
  onBracketOptionsUpdate?: (updatedOptions: Record<string, string[]>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const PromptEditor = forwardRef<HTMLTextAreaElement, PromptEditorProps>(({
  value,
  onChange,
  selectedOptions,
  onSelectedOptionsChange,
  brackets,
  onBracketClick,
  onSelectedOptionClick,
  placeholder = "在这里输入您的问题或指令...",
  height = "12rem",
  useContentEditable = false,
  bracketOptions,
  onGenerateMoreOptions,
  onBracketOptionsUpdate,
  onKeyDown
}, ref) => {
  if (useContentEditable) {
    return (
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
    );
  }

  return (
    <OverlayTextareaPrompt
      ref={ref}
      value={value}
      onChange={onChange}
      selectedOptions={selectedOptions}
      onSelectedOptionsChange={onSelectedOptionsChange}
      brackets={brackets}
      onBracketClick={onBracketClick}
      onSelectedOptionClick={onSelectedOptionClick}
      placeholder={placeholder}
      height={height}
      computeTextDiff={computeTextDiff}
      onKeyDown={onKeyDown}
    />
  );
});

PromptEditor.displayName = 'PromptEditor'; 