/**
 * Lexical相关类型定义
 * 
 * 提供组件：
 * 1. LexicalPromptEditor组件的Props接口
 * 2. 插件组件的通用接口
 * 3. 钩子函数的参数和返回值类型
 * 4. 节点相关的序列化接口
 * 
 * 类型分类：
 * - Props: 组件属性接口
 * - Config: 配置相关接口
 * - Events: 事件处理相关接口
 * - State: 状态管理相关接口
 * - Utils: 工具函数相关接口
 * 
 * 扩展性：
 * - 支持泛型约束
 * - 便于类型推导和智能提示
 * - 统一的命名规范
 */

import { LexicalEditor } from 'lexical';
import { BracketNode } from '../../../nodes/BracketNode';
import { SelectedValueNode } from '../../../nodes/SelectedValueNode';
import { BracketOption } from '../../types';

// ============================================================================
// 组件Props接口
// ============================================================================

/**
 * LexicalPromptEditor组件Props
 */
export interface LexicalPromptEditorProps {
  /** 编辑器内容值 */
  value: string;
  /** 内容变化回调 */
  onChange: (value: string) => void;
  /** 方括号选项配置 */
  bracketOptions: Record<string, BracketOption>;
  /** 占位符文本 */
  placeholder?: string;
  /** 编辑器高度 */
  height?: string;
  /** 额外的CSS类名 */
  className?: string;
}

/**
 * 模板解析插件Props
 */
export interface TemplateParserPluginProps {
  /** 要解析的模板字符串 */
  initialValue: string;
  /** 方括号选项配置 */
  bracketOptions: Record<string, BracketOption>;
}

/**
 * 点击处理插件Props
 */
export interface ClickHandlerPluginProps {
  /** 方括号选项配置 */
  bracketOptions: Record<string, BracketOption>;
  /** 方括号点击回调 */
  onBracketClick: BracketClickHandler;
  /** 已选择值点击回调 */
  onSelectedValueClick: SelectedValueClickHandler;
}

// ============================================================================
// 事件处理接口
// ============================================================================

/**
 * 方括号点击处理函数类型
 */
export type BracketClickHandler = (
  bracketType: string,
  options: string[],
  node: BracketNode,
  editor: LexicalEditor
) => void;

/**
 * 已选择值点击处理函数类型
 */
export type SelectedValueClickHandler = (
  node: SelectedValueNode,
  editor: LexicalEditor
) => void;

/**
 * 选项选择处理函数类型
 */
export type OptionSelectHandler = (option: string) => void;

/**
 * 编辑器变化处理函数类型
 */
export type EditorChangeHandler = (value: string) => void;

// ============================================================================
// 状态管理接口
// ============================================================================

/**
 * 当前选中状态
 */
export interface CurrentSelection {
  /** 选项类型 */
  type: string;
  /** 可选项列表 */
  options: string[];
  /** 被选中的节点 */
  node: BracketNode | SelectedValueNode | null;
  /** 编辑器实例 */
  editor: LexicalEditor | null;
}

/**
 * 选项选择钩子返回值
 */
export interface UseOptionSelectionReturn {
  /** 选项面板是否显示 */
  isShowingOptions: boolean;
  /** 当前选中的节点信息 */
  currentSelection: CurrentSelection | null;
  /** 方括号点击处理函数 */
  handleBracketClick: BracketClickHandler;
  /** 已选择值点击处理函数 */
  handleSelectedValueClick: SelectedValueClickHandler;
  /** 选项选择处理函数 */
  handleOptionSelect: OptionSelectHandler;
  /** 关闭选项面板函数 */
  closeOptionsPanel: () => void;
}

// ============================================================================
// 配置接口
// ============================================================================

/**
 * 编辑器配置选项
 */
export interface UseLexicalConfigOptions {
  /** 编辑器命名空间 */
  namespace?: string;
  /** 是否可编辑 */
  editable?: boolean;
  /** 额外的主题配置 */
  additionalTheme?: Record<string, any>;
}

/**
 * 选项选择钩子配置
 */
export interface UseOptionSelectionOptions {
  /** 方括号选项配置 */
  bracketOptions: Record<string, BracketOption>;
}

// ============================================================================
// 节点相关接口
// ============================================================================

/**
 * 方括号节点数据
 */
export interface BracketNodeData {
  /** 显示文本 */
  text: string;
  /** 方括号类型 */
  bracketType: string;
  /** 可选项列表 */
  options: string[];
}

/**
 * 已选择值节点数据
 */
export interface SelectedValueNodeData {
  /** 选择的值 */
  text: string;
  /** 原始方括号 */
  originalBracket: string;
  /** 值类型 */
  valueType: string;
}

// ============================================================================
// 工具函数接口
// ============================================================================

/**
 * 模板解析结果
 */
export interface ParseResult {
  /** 解析后的节点列表 */
  nodes: Array<any>;
  /** 方括号节点数量 */
  bracketCount: number;
  /** 是否解析成功 */
  success: boolean;
}

/**
 * 光标位置策略
 */
export type CursorStrategy = 'start' | 'end' | 'select-all';

/**
 * 错误处理回调
 */
export type ErrorHandler = (error: Error, context?: string) => void;

// ============================================================================
// 常量类型
// ============================================================================

/**
 * 编辑器命名空间
 */
export type EditorNamespace = 'PromptEditor' | 'TemplateEditor' | 'PreviewEditor';

/**
 * 主题类型
 */
export type ThemeType = 'default' | 'dark' | 'compact';

/**
 * 节点类型
 */
export type NodeType = 'bracket' | 'selected-value' | 'text' | 'paragraph';

// ============================================================================
// 外部依赖类型（重新导出）
// ============================================================================

export type { LexicalEditor } from 'lexical';
export type { BracketOption } from '../../types'; 