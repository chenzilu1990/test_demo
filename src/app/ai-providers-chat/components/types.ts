// 对话消息类型
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
  timestamp: Date;
  model?: string;
  isStreaming?: boolean;
  streamContent?: string;
}

// 模型选项类型
export interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

// 对话类型
export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  model?: string;
  provider?: string;
}

// 对话元数据类型（用于列表显示）
export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  model?: string;
  provider?: string;
  messageCount: number;
  lastMessage?: ConversationMessage;
}

