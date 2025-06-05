import { BracketFormatConfig } from '../types';

// 示例：自定义括号格式配置
export const CUSTOM_BRACKET_FORMATS: BracketFormatConfig[] = [
  // 默认格式
  {
    regex: /\{\{([^\}]*)\}\}/g,
    type: 'double-brace',
    priority: 4,
    description: '双花括号',
    className: 'text-purple-600 hover:bg-purple-100/50 dark:hover:bg-purple-900/50'
  },
  {
    regex: /\{([^\}]*)\}/g,
    type: 'single-brace',
    priority: 3,
    description: '单花括号',
    className: 'text-blue-500 hover:bg-blue-100/50 dark:hover:bg-blue-900/50'
  },
  {
    regex: /\[([^\]]*)\]/g,
    type: 'bracket',
    priority: 2,
    description: '方括号',
    className: 'text-green-600 hover:bg-green-100/50 dark:hover:bg-green-900/50'
  },
  
  // 扩展格式示例
  {
    regex: /<([^>]*)>/g,
    type: 'angle-bracket',
    priority: 1,
    description: '尖括号',
    className: 'text-orange-600 hover:bg-orange-100/50 dark:hover:bg-orange-900/50'
  },
  {
    regex: /\(\(([^\)]*)\)\)/g,
    type: 'double-parenthesis',
    priority: 5,
    description: '双圆括号',
    className: 'text-red-600 hover:bg-red-100/50 dark:hover:bg-red-900/50'
  },
  {
    regex: /\$\{([^\}]*)\}/g,
    type: 'dollar-brace',
    priority: 6,
    description: '美元符号花括号',
    className: 'text-indigo-600 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50'
  }
];

// 示例：简化配置（只支持方括号和花括号）
export const SIMPLE_BRACKET_FORMATS: BracketFormatConfig[] = [
  {
    regex: /\{([^\}]*)\}/g,
    type: 'brace',
    priority: 2,
    description: '花括号',
    className: 'text-blue-500 hover:bg-blue-100/50 dark:hover:bg-blue-900/50'
  },
  {
    regex: /\[([^\]]*)\]/g,
    type: 'bracket',
    priority: 1,
    description: '方括号',
    className: 'text-green-600 hover:bg-green-100/50 dark:hover:bg-green-900/50'
  }
];

// 示例：模板特定格式
export const TEMPLATE_BRACKET_FORMATS: BracketFormatConfig[] = [
  {
    regex: /\{\{([^\}]*)\}\}/g,
    type: 'variable',
    priority: 3,
    description: '变量',
    className: 'text-purple-600 hover:bg-purple-100/50 dark:hover:bg-purple-900/50'
  },
  {
    regex: /\{%([^%]*)%\}/g,
    type: 'tag',
    priority: 2,
    description: '标签',
    className: 'text-amber-600 hover:bg-amber-100/50 dark:hover:bg-amber-900/50'
  },
  {
    regex: /\{#([^#]*)#\}/g,
    type: 'comment',
    priority: 1,
    description: '注释',
    className: 'text-gray-500 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
  }
]; 