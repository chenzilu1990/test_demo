// types.ts - 带参数的模板类型定义
export interface PromptTemplate {
  title?: string;
  prompt: string;
  parameterOptions?: Record<string, string[]>;
}

/**
 * 定义参数化提示词中每个参数的选项。
 * 使用Record<string, string[]>，其中key是参数名 (例如 "国家")，
 * value是该参数的可选值列表 (例如 ["美国", "中国"]).
 */
export type BracketParameterOptions = Record<string, string[]>;

// 参数化提示词中每个参数的选项
export interface SelectedOption {
  id: string;           // 唯一标识符
  type: string;
  originalBracket: string; // 原始方括号内容，如 "[国家]"
  selectedValue: string;   // 已选择的值，如 "中国"
  position: {start: number; end: number};
}

// 括号格式配置接口
export interface BracketFormatConfig {
  /** 正则表达式，需要包含一个捕获组来提取内容 */
  regex: RegExp;
  /** 格式类型名称 */
  type: string;
  /** 优先级，数字越大优先级越高，用于处理重叠情况 */
  priority: number;
  /** 格式描述，用于UI显示 */
  description?: string;
  /** 自定义样式类名 */
  className?: string;
}

// 默认括号格式配置
export const DEFAULT_BRACKET_FORMATS: BracketFormatConfig[] = [
  {
    regex: /\{\{([^\}]*)\}\}/g,
    type: 'double-brace',
    priority: 3,
    description: '双花括号',
    className: 'text-blue-500 hover:bg-blue-100/50 dark:hover:bg-blue-900/50'
  },
  {
    regex: /\{([^\}]*)\}/g,
    type: 'single-brace',
    priority: 2,
    description: '单花括号',
    className: 'text-blue-500 hover:bg-blue-100/50 dark:hover:bg-blue-900/50'
  },
  {
    regex: /\[([^\]]*)\]/g,
    type: 'bracket',
    priority: 1,
    description: '方括号',
    className: 'text-blue-500 hover:bg-blue-100/50 dark:hover:bg-blue-900/50'
  }
];

