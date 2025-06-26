import { Conversation, ConversationMessage } from '../components/types';

/**
 * 根据contextMessageIds获取上下文消息
 */
export function getContextMessages(conversation: Conversation): ConversationMessage[] {
  if (!conversation.contextMessageIds || conversation.contextMessageIds.length === 0) {
    return [];
  }
  
  const messageMap = new Map(conversation.messages.map(msg => [msg.id, msg]));
  
  return conversation.contextMessageIds
    .map(id => messageMap.get(id))
    .filter((msg): msg is ConversationMessage => msg !== undefined);
}

/**
 * 检查消息是否在上下文中
 */
export function isMessageInContext(conversation: Conversation, messageId: string): boolean {
  return conversation.contextMessageIds.includes(messageId);
}

/**
 * 添加消息到上下文
 */
export function addMessageToContext(conversation: Conversation, messageId: string): string[] {
  if (conversation.contextMessageIds.includes(messageId)) {
    return conversation.contextMessageIds;
  }
  
  return [...conversation.contextMessageIds, messageId];
}

/**
 * 从上下文移除消息
 */
export function removeMessageFromContext(conversation: Conversation, messageId: string): string[] {
  return conversation.contextMessageIds.filter(id => id !== messageId);
}

/**
 * 批量更新上下文消息ID
 */
export function updateContextMessageIds(conversation: Conversation, newContextIds: string[]): Conversation {
  return {
    ...conversation,
    contextMessageIds: newContextIds,
    updatedAt: new Date()
  };
}

/**
 * 重置上下文为最新N条消息
 */
export function resetContextToRecentMessages(conversation: Conversation, count: number): string[] {
  return conversation.messages
    .slice(-count)
    .map(msg => msg.id);
}

/**
 * 重置上下文为所有消息
 */
export function resetContextToAllMessages(conversation: Conversation): string[] {
  return conversation.messages.map(msg => msg.id);
}

/**
 * 获取不在上下文中的历史消息
 */
export function getHistoryMessages(conversation: Conversation): ConversationMessage[] {
  const contextIdSet = new Set(conversation.contextMessageIds);
  return conversation.messages.filter(msg => !contextIdSet.has(msg.id));
}

/**
 * 数据迁移：为老格式数据生成contextMessageIds
 */
export function migrateConversationToContextIds(conversation: any): Conversation {
  // 如果已经有contextMessageIds，直接返回
  if (conversation.contextMessageIds) {
    return conversation as Conversation;
  }
  
  // 如果有老的contextMessages字段，使用其ID
  if (conversation.contextMessages && Array.isArray(conversation.contextMessages)) {
    return {
      ...conversation,
      contextMessageIds: conversation.contextMessages.map((msg: ConversationMessage) => msg.id),
      // 移除老的contextMessages字段
      contextMessages: undefined
    };
  }
  
  // 默认情况：所有消息都在上下文中
  return {
    ...conversation,
    contextMessageIds: conversation.messages?.map((msg: ConversationMessage) => msg.id) || []
  };
}

/**
 * 验证上下文ID的有效性
 */
export function validateContextIds(conversation: Conversation): string[] {
  const messageIdSet = new Set(conversation.messages.map(msg => msg.id));
  return conversation.contextMessageIds.filter(id => messageIdSet.has(id));
}

/**
 * 计算上下文统计信息
 */
export function getContextStats(conversation: Conversation) {
  const contextMessages = getContextMessages(conversation);
  const totalMessages = conversation.messages.length;
  const contextCount = contextMessages.length;
  const historyCount = totalMessages - contextCount;
  
  return {
    totalMessages,
    contextCount,
    historyCount,
    contextRatio: totalMessages > 0 ? contextCount / totalMessages : 0
  };
}