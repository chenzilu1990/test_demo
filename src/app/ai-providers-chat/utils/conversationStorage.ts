import { Conversation, ConversationMessage, ConversationMeta } from '../components/types';

const CONVERSATIONS_STORAGE_KEY = 'ai-chat-conversations';
const CURRENT_CONVERSATION_KEY = 'ai-chat-current-conversation';

/**
 * 生成唯一的对话ID
 */
export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 根据消息内容生成对话标题
 */
export function generateConversationTitle(messages: ConversationMessage[]): string {
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  if (!firstUserMessage) {
    return '新对话';
  }
  
  // 取前30个字符作为标题
  const title = firstUserMessage.content.trim().substring(0, 30);
  return title.length < firstUserMessage.content.trim().length ? `${title}...` : title;
}

/**
 * 加载所有对话
 */
export function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (!stored) return [];
    
    const conversations = JSON.parse(stored);
    // 转换日期字符串为Date对象
    return conversations.map((conv: any) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return [];
  }
}

/**
 * 保存对话
 */
export function saveConversation(conversation: Conversation): void {
  if (typeof window === 'undefined') return;
  
  try {
    const conversations = loadConversations();
    const existingIndex = conversations.findIndex(conv => conv.id === conversation.id);
    
    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.push(conversation);
    }
    
    // 按更新时间排序，最新的在前面
    conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Failed to save conversation:', error);
  }
}

/**
 * 删除对话
 */
export function deleteConversation(conversationId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const conversations = loadConversations();
    const filteredConversations = conversations.filter(conv => conv.id !== conversationId);
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(filteredConversations));
  } catch (error) {
    console.error('Failed to delete conversation:', error);
  }
}

/**
 * 获取对话
 */
export function getConversation(conversationId: string): Conversation | null {
  const conversations = loadConversations();
  return conversations.find(conv => conv.id === conversationId) || null;
}

/**
 * 获取对话元数据列表（用于列表显示）
 */
export function getConversationMetas(): ConversationMeta[] {
  const conversations = loadConversations();
  
  return conversations.map(conv => ({
    id: conv.id,
    title: conv.title,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    model: conv.model,
    provider: conv.provider,
    messageCount: conv.messages.length,
    lastMessage: conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : undefined
  }));
}

/**
 * 创建新对话
 */
export function createConversation(model?: string, provider?: string): Conversation {
  const now = new Date();
  const conversation: Conversation = {
    id: generateConversationId(),
    title: '新对话',
    messages: [],
    createdAt: now,
    updatedAt: now,
    model,
    provider
  };
  
  return conversation;
}

/**
 * 更新对话标题
 */
export function updateConversationTitle(conversationId: string, title: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const conversations = loadConversations();
    const conversation = conversations.find(conv => conv.id === conversationId);
    
    if (conversation) {
      conversation.title = title;
      conversation.updatedAt = new Date();
      saveConversation(conversation);
    }
  } catch (error) {
    console.error('Failed to update conversation title:', error);
  }
}

/**
 * 更新对话消息
 */
export function updateConversationMessages(conversationId: string, messages: ConversationMessage[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const conversations = loadConversations();
    const conversation = conversations.find(conv => conv.id === conversationId);
    
    if (conversation) {
      conversation.messages = messages;
      conversation.updatedAt = new Date();
      
      // 如果是第一条用户消息，自动生成标题
      if (conversation.title === '新对话' && messages.length > 0) {
        conversation.title = generateConversationTitle(messages);
      }
      
      saveConversation(conversation);
    }
  } catch (error) {
    console.error('Failed to update conversation messages:', error);
  }
}

/**
 * 获取当前对话ID
 */
export function getCurrentConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem(CURRENT_CONVERSATION_KEY);
}

/**
 * 设置当前对话ID
 */
export function setCurrentConversationId(conversationId: string): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(CURRENT_CONVERSATION_KEY, conversationId);
}

/**
 * 清除当前对话ID
 */
export function clearCurrentConversationId(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(CURRENT_CONVERSATION_KEY);
}

/**
 * 复制对话
 */
export function duplicateConversation(conversationId: string): Conversation | null {
  const sourceConversation = getConversation(conversationId);
  if (!sourceConversation) return null;
  
  const now = new Date();
  const duplicatedConversation: Conversation = {
    ...sourceConversation,
    id: generateConversationId(),
    title: `${sourceConversation.title} (副本)`,
    createdAt: now,
    updatedAt: now
  };
  
  saveConversation(duplicatedConversation);
  return duplicatedConversation;
}