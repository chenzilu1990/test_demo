import { useMemo } from 'react';
import { ConversationMessage, ContextInfo, ContextStatus } from './types';

// 简单的token估算：中文约1字符=1token，英文约4字符=1token
const estimateTokens = (text: string): number => {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars * 1.2 + otherChars / 3.5);
};

interface UseContextCalculationProps {
  messages: ConversationMessage[];
  contextWindowTokens: number;
  fadingZoneRatio?: number; // 淡出区域占总上下文的比例，默认0.15 (15%)
}

interface ContextCalculationResult {
  processedMessages: ConversationMessage[];
  totalTokens: number;
  activeTokens: number;
  utilizationRate: number;
  remainingTokens: number;
  contextBoundary: {
    startIndex: number; // 上下文窗口开始的消息索引
    endIndex: number; // 上下文窗口结束的消息索引（通常是最新消息）
    startPercentage: number; // 开始位置的百分比
    endPercentage: number; // 结束位置的百分比
  } | null;
}

export const useContextCalculation = ({
  messages,
  contextWindowTokens,
  fadingZoneRatio = 0.15
}: UseContextCalculationProps): ContextCalculationResult => {
  
  return useMemo(() => {
    if (!messages.length || !contextWindowTokens) {
      return {
        processedMessages: messages,
        totalTokens: 0,
        activeTokens: 0,
        utilizationRate: 0,
        remainingTokens: contextWindowTokens,
        contextBoundary: null
      };
    }

    // 计算每条消息的token数
    const messagesWithTokens = messages.map(msg => ({
      ...msg,
      estimatedTokens: estimateTokens(msg.isStreaming && msg.streamContent ? msg.streamContent : msg.content)
    }));

    // 从最新消息开始累计token
    let cumulativeTokens = 0;
    const fadingZoneTokens = contextWindowTokens * fadingZoneRatio;
    const activeZoneTokens = contextWindowTokens - fadingZoneTokens;

    const processedMessages = messagesWithTokens.reverse().map((msg) => {
      const msgTokens = msg.estimatedTokens;
      const messageStartTokens = cumulativeTokens;
      cumulativeTokens += msgTokens;

      let contextInfo: ContextInfo;

      if (messageStartTokens + msgTokens <= activeZoneTokens) {
        // 完全在活跃区域内
        contextInfo = {
          status: 'active' as ContextStatus,
          opacity: 1.0,
          tokenCount: msgTokens,
          distanceFromWindow: Math.max(0, activeZoneTokens - (messageStartTokens + msgTokens))
        };
      } else if (messageStartTokens < contextWindowTokens) {
        // 部分或完全在淡出区域
        const fadeProgress = Math.max(0, (messageStartTokens - activeZoneTokens) / fadingZoneTokens);
        const opacity = Math.max(0.2, 1.0 - fadeProgress * 0.8);
        
        contextInfo = {
          status: 'fading' as ContextStatus,
          opacity: Math.round(opacity * 100) / 100,
          tokenCount: msgTokens,
          distanceFromWindow: Math.max(0, contextWindowTokens - (messageStartTokens + msgTokens))
        };
      } else {
        // 完全超出上下文窗口
        contextInfo = {
          status: 'inactive' as ContextStatus,
          opacity: 0.15,
          tokenCount: msgTokens,
          distanceFromWindow: messageStartTokens - contextWindowTokens
        };
      }

      return {
        ...msg,
        contextInfo
      };
    }).reverse(); // 恢复原来的顺序

    const totalTokens = cumulativeTokens;
    const activeTokens = Math.min(totalTokens, contextWindowTokens);
    const utilizationRate = Math.round((activeTokens / contextWindowTokens) * 100);
    const remainingTokens = Math.max(0, contextWindowTokens - totalTokens);

    // 计算上下文边界
    let contextBoundary = null;
    if (processedMessages.length > 0) {
      // 找到第一条完全在上下文窗口内的消息
      let startIndex = -1;
      let endIndex = processedMessages.length - 1; // 最新消息总是结束位置
      
      for (let i = 0; i < processedMessages.length; i++) {
        const msg = processedMessages[i];
        if (msg.contextInfo && msg.contextInfo.status !== 'inactive') {
          startIndex = i;
          break;
        }
      }

      if (startIndex !== -1) {
        const startPercentage = (startIndex / Math.max(1, processedMessages.length - 1)) * 100;
        const endPercentage = (endIndex / Math.max(1, processedMessages.length - 1)) * 100;
        
        contextBoundary = {
          startIndex,
          endIndex,
          startPercentage: Math.max(0, Math.min(100, startPercentage)),
          endPercentage: Math.max(0, Math.min(100, endPercentage))
        };
      }
    }

    return {
      processedMessages,
      totalTokens,
      activeTokens,
      utilizationRate,
      remainingTokens,
      contextBoundary
    };
  }, [messages, contextWindowTokens, fadingZoneRatio]);
};

// 获取上下文状态的描述文本
export const getContextStatusText = (utilizationRate: number): { text: string; color: string } => {
  if (utilizationRate <= 70) {
    return { text: '上下文充足', color: 'text-green-600 dark:text-green-400' };
  } else if (utilizationRate <= 85) {
    return { text: '上下文适中', color: 'text-yellow-600 dark:text-yellow-400' };
  } else if (utilizationRate <= 95) {
    return { text: '上下文较满', color: 'text-orange-600 dark:text-orange-400' };
  } else {
    return { text: '上下文将满', color: 'text-red-600 dark:text-red-400' };
  }
};

// 获取建议操作
export const getContextSuggestion = (utilizationRate: number): string | null => {
  if (utilizationRate <= 85) {
    return null;
  } else if (utilizationRate <= 95) {
    return '建议简化消息内容或清理历史对话';
  } else {
    return '建议开启新对话以获得最佳体验';
  }
};