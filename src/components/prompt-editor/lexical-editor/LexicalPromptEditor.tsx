/**
 * Lexical智能提示词编辑器 (LexicalPromptEditor)
 * 
 * 核心功能：
 * 1. 基于Lexical框架的富文本编辑器
 * 2. 支持参数化提示词模板 (方括号语法)
 * 3. 交互式参数选择 (点击方括号弹出选项)
 * 4. 智能光标管理和错误处理
 * 
 * 架构组成：
 * - TemplateParserPlugin: 模板解析插件
 * - ClickHandlerPlugin: 点击交互插件
 * - OptionPanel: 选项选择面板
 * - useLexicalConfig: 编辑器配置钩子
 * - useOptionSelection: 选项选择逻辑钩子
 * 
 * 使用场景：
 * - AI提示词模板编辑
 * - 参数化文本内容生成
 * - 交互式表单构建
 * 
 * 性能特点：
 * - 组件级别的懒加载
 * - 智能重渲染优化
 * - 内存泄漏防护
 */

"use client";

import React, { useEffect, useCallback } from 'react';
import { $getRoot, EditorState, LexicalEditor } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

// 导入拆分后的模块
import { TemplateParserPlugin } from './lexical-plugins/TemplateParserPlugin';
import { ClickHandlerPlugin } from './lexical-plugins/ClickHandlerPlugin';
import { useLexicalConfig } from './lexical-hooks/useLexicalConfig';
import { useOptionSelection } from './lexical-hooks/useOptionSelection';
import OptionPanel from '../OptionPanel';

// 导入类型定义
import type { LexicalPromptEditorProps } from './lexical-types';

/**
 * Lexical智能提示词编辑器主组件
 * 
 * @param value - 编辑器内容值
 * @param onChange - 内容变化回调
 * @param bracketOptions - 方括号选项配置
 * @param placeholder - 占位符文本
 * @param height - 编辑器高度
 * @param className - 额外的CSS类名
 */
export default function LexicalPromptEditor({
  value,
  onChange,
  bracketOptions,
  placeholder = "输入您的提示词模板...",
  height = "12rem",
  className = ""
}: LexicalPromptEditorProps) {
  
  // ========================================================================
  // 钩子和状态管理
  // ========================================================================
  
  // 编辑器配置
  const initialConfig = useLexicalConfig({
    namespace: 'PromptEditor',
    editable: true,
  });
  
  // 选项选择逻辑
  const {
    isShowingOptions,
    currentSelection,
    handleBracketClick,
    handleSelectedValueClick,
    handleOptionSelect,
    closeOptionsPanel,
  } = useOptionSelection({ bracketOptions });

  // ========================================================================
  // 事件处理函数
  // ========================================================================
  
  /**
   * 处理编辑器内容变化
   * 优化：使用useCallback避免不必要的重渲染
   */
  const handleEditorChange = useCallback((editorState: EditorState, editor: LexicalEditor) => {
    editorState.read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      onChange(textContent);
    });
  }, [onChange]);

  /**
   * 处理点击面板外部关闭选项面板
   * 优化：智能事件过滤，只处理相关的点击
   */
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // 检查点击目标，如果不是相关元素则关闭面板
    if (isShowingOptions && 
        !target.closest('.option-panel') && 
        !target.closest('.bracket-node') && 
        !target.closest('.selected-value-node')) {
      closeOptionsPanel();
    }
  }, [isShowingOptions, closeOptionsPanel]);

  // ========================================================================
  // 副作用处理
  // ========================================================================
  
  /**
   * 管理全局点击事件监听
   * 用于点击面板外部时关闭选项面板
   */
  useEffect(() => {
    if (isShowingOptions) {
      // 使用mousedown事件确保在click事件之前触发
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isShowingOptions, handleClickOutside]);

  // ========================================================================
  // 渲染逻辑
  // ========================================================================
  
  return (
    <div className={`lexical-prompt-editor relative ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        {/* 编辑器容器 */}
        <div className="lexical-editor-container relative">
          
          {/* 富文本编辑器插件 */}
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={`
                  lexical-content-editable
                  outline-none p-3 border rounded-md resize-none 
                  dark:bg-gray-700 dark:border-gray-600 
                  focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                  transition-colors duration-200
                `}
                style={{ height, minHeight: '3rem' }}
                data-lexical-editor
                aria-label={placeholder}
              />
            }
            placeholder={
              <div className="lexical-placeholder absolute top-3 left-3 text-gray-400 pointer-events-none select-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          
          {/* 核心功能插件 */}
          <OnChangePlugin onChange={handleEditorChange} />
          <HistoryPlugin />
          
          {/* 自定义插件 */}
          <TemplateParserPlugin 
            initialValue={value} 
            bracketOptions={bracketOptions} 
          />
          <ClickHandlerPlugin
            bracketOptions={bracketOptions}
            onBracketClick={handleBracketClick}
            onSelectedValueClick={handleSelectedValueClick}
          />
        </div>

        {/* 选项面板 */}
        {currentSelection && (
          <OptionPanel
            isVisible={isShowingOptions}
            onClose={closeOptionsPanel}
            onOptionSelect={handleOptionSelect}
            options={currentSelection.options}
            type={currentSelection.type}
          />
        )}
      </LexicalComposer>
      
      {/* 状态指示器 (开发环境) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="lexical-debug-info absolute bottom-1 right-1 text-xs text-gray-400">
          {isShowingOptions ? '🎯 选项面板开启' : '✏️ 编辑模式'}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 组件元数据和默认导出
// ============================================================================

/**
 * 组件显示名称（用于React DevTools）
 */
LexicalPromptEditor.displayName = 'LexicalPromptEditor';

/**
 * 组件版本信息
 */
LexicalPromptEditor.version = '2.0.0';

/**
 * 支持的功能特性
 */
LexicalPromptEditor.features = [
  'template-parsing',
  'interactive-brackets', 
  'smart-cursor',
  'error-boundary',
  'performance-optimized'
] as const;
