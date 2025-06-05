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

