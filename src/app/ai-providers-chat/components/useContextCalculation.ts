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

type ContextIndicatorStatus = 'safe' | 'warning' | 'critical';

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
  cutoffInfo: {
    cutoffIndex: number; // 临界消息的索引，-1 表示所有消息都在上下文中
    cutoffMessageId: string | null; // 临界消息的 ID
    isAllInContext: boolean; // 是否所有消息都在上下文中
    tokensAtCutoff: number; // 到临界消息为止的 token 总数
  };
  contextIndicatorStatus: ContextIndicatorStatus; // 上下文指示区的状态
  

}

export const useContextCalculation = ({
  messages,
  contextWindowTokens,
  fadingZoneRatio = 0.15
}: UseContextCalculationProps): ContextCalculationResult => {
  
  return useMemo(() => {
    // 快速返回空结果，避免中间状态
    if (!messages.length || !contextWindowTokens) {
      return {
        processedMessages: messages,
        totalTokens: 0,
        activeTokens: 0,
        utilizationRate: 0,
        remainingTokens: contextWindowTokens,
        contextBoundary: null,
        cutoffInfo: {
          cutoffIndex: -1,
          cutoffMessageId: null,
          isAllInContext: true,
          tokensAtCutoff: 0
        },
        contextIndicatorStatus: 'safe' as ContextIndicatorStatus,

      };
    }

    // 计算每条消息的token数
    const messagesWithTokens = messages.map(msg => ({
      ...msg,
      estimatedTokens: estimateTokens(msg.isStreaming && msg.streamContent ? msg.streamContent : msg.content)
    }));

    // 第一步：找到临界消息（从最新消息向最老消息遍历）
    let accumulatedTokens = 0;
    let cutoffIndex = -1;
    let cutoffMessageId: string | null = null;
    let tokensAtCutoff = 0;
    
    // 从最后一条消息（最新）开始向前遍历
    for (let i = messagesWithTokens.length - 1; i >= 0; i--) {
      const msg = messagesWithTokens[i];
      const msgTokens = msg.estimatedTokens;
      
      // 如果加上这条消息会超过上下文窗口
      if (accumulatedTokens + msgTokens > contextWindowTokens) {
        cutoffIndex = i;
        cutoffMessageId = msg.id;
        tokensAtCutoff = accumulatedTokens;
        break;
      }
      
      accumulatedTokens += msgTokens;
    }
    
    const isAllInContext = cutoffIndex === -1;

    // 从最新消息开始累计token（用于原有的处理逻辑）
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

    // 计算上下文指示区状态
    const contextIndicatorStatus: ContextIndicatorStatus = 
      utilizationRate >= 100 ? 'critical' :
      utilizationRate >= 90 ? 'warning' : 'safe';

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
      contextBoundary,
      cutoffInfo: {
        cutoffIndex,
        cutoffMessageId,
        isAllInContext,
        tokensAtCutoff
      },
      contextIndicatorStatus,

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