import { ConversationMessage, Conversation } from '../components/types';
import { getContextMessages } from './contextManager';

export interface CleanupStrategy {
  id: string;
  name: string;
  description: string;
  icon: string;
  execute: (conversation: Conversation, contextWindowTokens?: number) => string[];
  preview?: (conversation: Conversation, contextWindowTokens?: number) => {
    keptMessageIds: string[];
    removedMessageIds: string[];
    keptMessages: ConversationMessage[];
    removedMessages: ConversationMessage[];
    savedTokens: number;
  };
}

// Token estimation helper
const estimateTokens = (text: string): number => {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars * 1.2 + otherChars / 3.5);
};

// Calculate total tokens for messages
const calculateTotalTokens = (messages: ConversationMessage[]): number => {
  return messages.reduce((total, msg) => {
    const content = msg.isStreaming && msg.streamContent ? msg.streamContent : msg.content;
    return total + estimateTokens(content);
  }, 0);
};

// 策略1: 保留最近N条消息
export const recentMessagesStrategy: CleanupStrategy = {
  id: 'recent',
  name: '保留最近消息',
  description: '保留最近的3-5条消息',
  icon: '🕐',
  execute: (conversation: Conversation, contextWindowTokens?: number) => {
    return conversation.messages.slice(-5).map(msg => msg.id);
  },
  preview: (conversation: Conversation, contextWindowTokens?: number) => {
    const keptMessages = conversation.messages.slice(-5);
    const removedMessages = conversation.messages.slice(0, -5);
    const keptMessageIds = keptMessages.map(m => m.id);
    const removedMessageIds = removedMessages.map(m => m.id);
    const savedTokens = calculateTotalTokens(removedMessages);
    return { keptMessageIds, removedMessageIds, keptMessages, removedMessages, savedTokens };
  }
};

// 策略2: 保留问答对
export const conversationPairsStrategy: CleanupStrategy = {
  id: 'pairs',
  name: '保留完整对话',
  description: '保留最近2轮完整的问答对话',
  icon: '💬',
  execute: (conversation: Conversation, contextWindowTokens?: number) => {
    const messages = conversation.messages;
    const pairs: ConversationMessage[] = [];
    let pairCount = 0;
    
    // 从后往前遍历，保留完整的问答对
    for (let i = messages.length - 1; i >= 0 && pairCount < 2; i--) {
      pairs.unshift(messages[i]);
      
      // 如果是用户消息，且前面有AI回复，算作一个完整对话
      if (messages[i].role === 'user' && i > 0 && messages[i-1].role === 'assistant') {
        pairs.unshift(messages[i-1]);
        i--; // 跳过已添加的AI消息
        pairCount++;
      }
    }
    
    return pairs.map(msg => msg.id);
  },
  preview: (conversation: Conversation, contextWindowTokens?: number) => {
    const keptMessageIds = conversationPairsStrategy.execute(conversation, contextWindowTokens);
    const keptIdSet = new Set(keptMessageIds);
    const keptMessages = conversation.messages.filter(m => keptIdSet.has(m.id));
    const removedMessages = conversation.messages.filter(m => !keptIdSet.has(m.id));
    const removedMessageIds = removedMessages.map(m => m.id);
    const savedTokens = calculateTotalTokens(removedMessages);
    return { keptMessageIds, removedMessageIds, keptMessages, removedMessages, savedTokens };
  }
};

// 策略3: 智能保留（基于消息长度和重要性）
export const smartCleanupStrategy: CleanupStrategy = {
  id: 'smart',
  name: '智能清理',
  description: '保留重要消息，清理冗长的历史对话',
  icon: '🧠',
  execute: (conversation: Conversation, contextWindowTokens?: number) => {
    const messages = conversation.messages;
    // 计算每条消息的重要性得分
    const scoredMessages = messages.map((msg, index) => {
      let score = 0;
      
      // 最近的消息得分更高
      score += (index / messages.length) * 50;
      
      // 用户消息通常更重要
      if (msg.role === 'user') score += 20;
      
      // 较短的消息可能是关键问题或总结
      const tokenCount = estimateTokens(msg.content);
      if (tokenCount < 100) score += 30;
      else if (tokenCount > 500) score -= 20;
      
      // 包含关键词的消息
      const keywords = ['重要', '关键', '总结', '结论', '核心', '主要'];
      if (keywords.some(keyword => msg.content.includes(keyword))) {
        score += 25;
      }
      
      return { message: msg, score, tokenCount };
    });
    
    // 按得分排序
    scoredMessages.sort((a, b) => b.score - a.score);
    
    // 保留高分消息，直到达到上下文窗口的70%
    const targetTokens = (contextWindowTokens || 4000) * 0.7;
    let currentTokens = 0;
    const keptMessages: ConversationMessage[] = [];
    
    for (const { message, tokenCount } of scoredMessages) {
      if (currentTokens + tokenCount <= targetTokens) {
        keptMessages.push(message);
        currentTokens += tokenCount;
      }
    }
    
    // 按原始顺序排序
    keptMessages.sort((a, b) => {
      const indexA = messages.findIndex(m => m.id === a.id);
      const indexB = messages.findIndex(m => m.id === b.id);
      return indexA - indexB;
    });
    
    return keptMessages.map(msg => msg.id);
  },
  preview: (conversation: Conversation, contextWindowTokens?: number) => {
    const keptMessageIds = smartCleanupStrategy.execute(conversation, contextWindowTokens);
    const keptIdSet = new Set(keptMessageIds);
    const keptMessages = conversation.messages.filter(m => keptIdSet.has(m.id));
    const removedMessages = conversation.messages.filter(m => !keptIdSet.has(m.id));
    const removedMessageIds = removedMessages.map(m => m.id);
    const savedTokens = calculateTotalTokens(removedMessages);
    return { keptMessageIds, removedMessageIds, keptMessages, removedMessages, savedTokens };
  }
};

// 策略4: 按百分比清理
export const percentageCleanupStrategy: CleanupStrategy = {
  id: 'percentage',
  name: '清理前半部分',
  description: '保留后50%的对话内容',
  icon: '📊',
  execute: (conversation: Conversation, contextWindowTokens?: number) => {
    const messages = conversation.messages;
    const halfIndex = Math.floor(messages.length / 2);
    return messages.slice(halfIndex).map(msg => msg.id);
  },
  preview: (conversation: Conversation, contextWindowTokens?: number) => {
    const messages = conversation.messages;
    const halfIndex = Math.floor(messages.length / 2);
    const keptMessages = messages.slice(halfIndex);
    const removedMessages = messages.slice(0, halfIndex);
    const keptMessageIds = keptMessages.map(m => m.id);
    const removedMessageIds = removedMessages.map(m => m.id);
    const savedTokens = calculateTotalTokens(removedMessages);
    return { keptMessageIds, removedMessageIds, keptMessages, removedMessages, savedTokens };
  }
};

// 导出所有策略
export const CLEANUP_STRATEGIES: CleanupStrategy[] = [
  recentMessagesStrategy,
  conversationPairsStrategy,
  smartCleanupStrategy,
  percentageCleanupStrategy
];

// 获取策略建议
export const getRecommendedStrategy = (
  conversation: Conversation, 
  contextWindowTokens: number,
  utilizationRate: number
): CleanupStrategy => {
  // 如果消息很少，使用保留最近消息策略
  if (conversation.messages.length <= 10) {
    return recentMessagesStrategy;
  }
  
  // 如果利用率很高，使用智能清理
  if (utilizationRate > 90) {
    return smartCleanupStrategy;
  }
  
  // 默认使用对话对策略
  return conversationPairsStrategy;
};