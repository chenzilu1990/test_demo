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

