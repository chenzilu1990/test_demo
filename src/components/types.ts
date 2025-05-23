// types.ts - 提取共用类型定义
export interface PromptTemplate {
  name: string;
  template: string;
}

export interface BracketOption {
  type: string;
  options: string[];
}

export interface SelectedOption {
  id: string;           // 唯一标识符
  type: string;
  originalBracket: string; // 原始方括号内容，如 "[国家]"
  selectedValue: string;   // 已选择的值，如 "中国"
  position: {start: number; end: number};
}
