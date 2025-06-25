// 上下文状态枚举
export type ContextStatus = 'active' | 'fading' | 'inactive';

// 上下文信息
export interface ContextInfo {
  status: ContextStatus;
  opacity: number;
  tokenCount: number;
  distanceFromWindow: number; // 距离上下文窗口边缘的token数
}

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
  contextInfo?: ContextInfo;
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

