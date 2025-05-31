/**
 * Lexical编辑器配置钩子 (useLexicalConfig)
 * 
 * 主要功能：
 * 1. 提供统一的编辑器初始配置
 * 2. 管理自定义节点注册 (BracketNode, SelectedValueNode)
 * 3. 配置主题样式和错误处理
 * 4. 性能优化配置
 * 
 * 配置说明：
 * - namespace: 编辑器命名空间，用于区分多个编辑器实例
 * - nodes: 注册的自定义节点类型
 * - theme: 主题配置，定义各种元素的CSS类
 * - onError: 错误处理函数
 * - editable: 是否可编辑
 * - disableBeforeInput: 是否禁用beforeinput事件（性能优化）
 * 
 * 扩展性：
 * - 可轻松添加新的自定义节点类型
 * - 支持主题定制和扩展
 * - 便于配置不同的编辑器实例
 */

import { useMemo } from 'react';
import { InitialConfigType } from '@lexical/react/LexicalComposer';
import { BracketNode } from '../nodes/BracketNode';
import { SelectedValueNode } from '../nodes/SelectedValueNode';

interface UseLexicalConfigOptions {
  /** 编辑器命名空间，默认为 'PromptEditor' */
  namespace?: string;
  /** 是否可编辑，默认为 true */
  editable?: boolean;
  /** 额外的主题配置 */
  additionalTheme?: Record<string, any>;
}

/**
 * 编辑器配置钩子
 * @param options - 配置选项
 * @returns Lexical编辑器初始配置对象
 */
export function useLexicalConfig(options: UseLexicalConfigOptions = {}) {
  const {
    namespace = 'PromptEditor',
    editable = true,
    additionalTheme = {}
  } = options;

  // 使用useMemo缓存配置对象，避免每次渲染时重新创建
  const initialConfig: InitialConfigType = useMemo(() => ({
    // 编辑器命名空间
    namespace,
    
    // 注册自定义节点类型
    nodes: [
      BracketNode,      // 蓝色方括号节点 (未选择状态)
      SelectedValueNode // 绿色已选择值节点
    ],
    
    // 错误处理函数
    onError: (error: Error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 Lexical编辑器错误:', error);
      }
      // 在生产环境中，可以发送错误到监控系统
      // errorReportingService.reportError(error);
    },
    
    // 主题配置
    theme: {
      // 文本样式
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
      },
      
      // 段落样式
      paragraph: 'mb-2',
      
      // 链接样式
      link: 'text-blue-600 hover:text-blue-800 underline',
      
      // 代码样式
      code: 'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-sm',
      
      // 合并额外的主题配置
      ...additionalTheme
    },
    
    // 性能优化配置
    editable,
    
    // 高级配置
    disableBeforeInput: false, // 保持默认行为，确保兼容性
    
  }), [namespace, editable, additionalTheme]);

  return initialConfig;
}

/**
 * 编辑器主题预设
 */
export const EDITOR_THEMES = {
  /** 默认主题 */
  default: {},
  
  /** 暗色主题 */
  dark: {
    text: {
      bold: 'font-bold text-white',
      italic: 'italic text-white',
    },
    code: 'bg-gray-700 text-gray-100 px-1 py-0.5 rounded font-mono text-sm',
  },
  
  /** 紧凑主题 */
  compact: {
    paragraph: 'mb-1',
  }
} as const;

/**
 * 编辑器命名空间常量
 */
export const EDITOR_NAMESPACES = {
  PROMPT_EDITOR: 'PromptEditor',
  TEMPLATE_EDITOR: 'TemplateEditor',
  PREVIEW_EDITOR: 'PreviewEditor',
} as const; 