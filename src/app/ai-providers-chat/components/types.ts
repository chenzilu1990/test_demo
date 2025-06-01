// 对话消息类型
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
  timestamp: Date;
  model?: string;
}

// 模型选项类型
export interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

// 带参数的模板类型定义
export interface PromptTemplateWithOptions {
  title: string;
  template: string;
  parameterOptions: Record<string, string[]>;
} 