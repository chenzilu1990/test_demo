import { useEffect, useRef, useState, useCallback } from 'react';
import { ConversationMessage } from './types';

interface MessagePosition {
  offsetTop: number;
  height: number;
  id: string;
}

interface UseMessagePositionsProps {
  messages: ConversationMessage[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  cutoffMessageId: string | null;
  contextsIds: string[];
}

interface UseMessagePositionsResult {
  messagePositions: Map<string, MessagePosition>;
  messageRefs: Map<string, HTMLDivElement>;
  setMessageRef: (id: string, element: HTMLDivElement | null) => void;

  updatePositions: () => void;
  contextLengthTopOffset: number;
  contextTopOffset: number;
}

export const useMessagePositions = ({
  messages,
  scrollContainerRef,
  cutoffMessageId,
  contextsIds,
}: UseMessagePositionsProps): UseMessagePositionsResult => {
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [messagePositions, setMessagePositions] = useState<Map<string, MessagePosition>>(new Map());
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [contextLengthTopOffset, setContextLengthTopOffset] = useState<number>(0);
  const [contextTopOffset, setContextTopOffset] = useState<number>(0);

  // 设置消息的 DOM 引用
  const setMessageRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      messageRefs.current.set(id, element);
    } else {
      messageRefs.current.delete(id);
    }
  }, []);

  // 更新所有消息的位置信息（带防抖）
  const updatePositions = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const newPositions = new Map<string, MessagePosition>();
    
    messageRefs.current.forEach((element, id) => {
      if (element && element.offsetParent) {
        // 计算相对于滚动容器的位置
        const rect = element.getBoundingClientRect();
        const parentHeight = container.scrollHeight;
        const offsetTop = element.offsetTop / parentHeight * 100; // 相对于滚动容器的偏移

        const height = rect.height;
        
        // 只有位置发生显著变化时才更新
        const existingPosition = messagePositions.get(id);
        const hasSignificantChange = !existingPosition || 
          Math.abs(existingPosition.offsetTop - offsetTop) > 1 ||
          Math.abs(existingPosition.height - height) > 1;
        
        if (hasSignificantChange) {
          newPositions.set(id, {
            id,
            offsetTop,
            height
          });
        } else {
          // 保留现有位置
          newPositions.set(id, existingPosition);
        }
      }
    });

    // 只有位置确实发生变化时才更新状态
    if (newPositions.size !== messagePositions.size || 
        Array.from(newPositions.values()).some(pos => {
          const existing = messagePositions.get(pos.id);
          return !existing || existing.offsetTop !== pos.offsetTop || existing.height !== pos.height;
        })) {
      setMessagePositions(newPositions);
    }
  }, [scrollContainerRef, messagePositions]);

  // 防抖的位置更新函数
  const debouncedUpdatePositions = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      updatePositions();
    }, 16); // 约60fps的更新频率
  }, [updatePositions]);

  // 获取上下文位置偏移量
  const getContextTopOffset = useCallback(() => {
    const position = messagePositions.get(contextsIds[0]);
    if (!position) return 0;
    return position.offsetTop || 0;
  }, [contextsIds, messagePositions]);
  
  // 获取临界消息偏移量
  const getContextLengthTopOffset = useCallback(() => {
    const position = messagePositions.get(cutoffMessageId || '');
    if (!position) return -10;
    return position.offsetTop || -10;
  }, [cutoffMessageId, messagePositions]);

  // 监听容器大小变化
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // 创建 ResizeObserver 来监听消息大小变化
    resizeObserverRef.current = new ResizeObserver((entries) => {
      // 使用防抖更新位置
      debouncedUpdatePositions();
    });

    // 观察所有消息元素
    messageRefs.current.forEach((element) => {
      resizeObserverRef.current?.observe(element);
    });

    // 初始更新位置
    updatePositions();

    return () => {
      resizeObserverRef.current?.disconnect();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [debouncedUpdatePositions, scrollContainerRef]);

  // 当消息列表变化时更新位置
  useEffect(() => {
    // 清理不存在的消息引用
    const currentMessageIds = new Set(messages.map(msg => msg.id));
    const refsToDelete: string[] = [];
    
    messageRefs.current.forEach((_, id) => {
      if (!currentMessageIds.has(id)) {
        refsToDelete.push(id);
      }
    });
    
    refsToDelete.forEach(id => {
      messageRefs.current.delete(id);
    });

    // 延迟更新位置，确保 DOM 已更新
    requestAnimationFrame(() => {
      debouncedUpdatePositions();
    });
  }, [messages, debouncedUpdatePositions]);

  // 监听消息元素的变化
  useEffect(() => {
    const observer = resizeObserverRef.current;
    if (!observer) return;

    // 重新观察所有消息元素
    messageRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      messageRefs.current.forEach((element) => {
        observer.unobserve(element);
      });
    };
  }, [messagePositions]); // 当位置更新时重新观察

  useEffect(() => {
    const newContextLengthTopOffset = getContextLengthTopOffset();
    setContextLengthTopOffset(newContextLengthTopOffset);
  }, [cutoffMessageId, messagePositions]);

  useEffect(() => {
    const newContextTopOffset = getContextTopOffset();
    setContextTopOffset(newContextTopOffset);
  }, [contextsIds]);

  return {
    messagePositions,
    messageRefs: messageRefs.current,
    setMessageRef,

    updatePositions,
    contextLengthTopOffset,
    contextTopOffset
  };
};