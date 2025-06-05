/**
 * Lexical智能提示词编辑器模块
 * 统一导出所有相关组件、钩子、插件和类型
 * 
 * 使用示例：
 * ```typescript
 * import { LexicalPromptEditor, useLexicalConfig } from '@/components/lexical-editor';
 * ```
 */

// ============================================================================
// 主要组件
// ============================================================================

export { default as LexicalPromptEditor } from './LexicalPromptEditor';

// ============================================================================
// 插件组件
// ============================================================================

export { TemplateParserPlugin } from './lexical-plugins/TemplateParserPlugin';
export { ClickHandlerPlugin } from './lexical-plugins/ClickHandlerPlugin';

// ============================================================================
// 钩子函数
// ============================================================================

export { useLexicalConfig, EDITOR_THEMES, EDITOR_NAMESPACES } from './lexical-hooks/useLexicalConfig';
export { useOptionSelection, CURSOR_STRATEGIES } from './lexical-hooks/useOptionSelection';
export { useCursorManager, CURSOR_RESTORE_STRATEGIES } from './lexical-hooks/useCursorManager';

// ============================================================================
// 类型定义
// ============================================================================

export type {
  // 组件Props
  LexicalPromptEditorProps,
  TemplateParserPluginProps,
  ClickHandlerPluginProps,
  
  // 事件处理
  BracketClickHandler,
  SelectedValueClickHandler,
  OptionSelectHandler,
  EditorChangeHandler,
  
  // 状态管理
  CurrentSelection,
  UseOptionSelectionReturn,
  
  // 配置
  UseLexicalConfigOptions,
  UseOptionSelectionOptions,
  
  // 节点数据
  BracketNodeData,
  SelectedValueNodeData,
  
  // 工具类型
  ParseResult,
  CursorStrategy,
  ErrorHandler,
  
  // 常量类型
  EditorNamespace,
  ThemeType,
  NodeType,
  
  // 外部类型
  LexicalEditor,
  BracketParameterOptions,
} from './lexical-types';

// ============================================================================
// 常量导出
// ============================================================================

/**
 * 编辑器版本信息
 */
export const LEXICAL_EDITOR_VERSION = '2.0.0';

/**
 * 支持的功能特性列表
 */
export const SUPPORTED_FEATURES = [
  'template-parsing',
  'interactive-brackets',
  'smart-cursor',
  'error-boundary',
  'performance-optimized',
  'keyboard-navigation',
  'accessibility-support'
] as const;

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  namespace: 'PromptEditor',
  placeholder: '输入您的提示词模板...',
  height: '12rem',
  editable: true,
} as const; 