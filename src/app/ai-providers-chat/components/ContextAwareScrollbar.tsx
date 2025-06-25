import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ConversationMessage } from './types';

interface ContextAwareScrollbarProps {
  messages: ConversationMessage[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  contextBoundary: {
    startIndex: number;
    endIndex: number;
    startPercentage: number;
    endPercentage: number;
  } | null;
  currentScrollPercentage?: number;
  onScrollToPercentage?: (percentage: number) => void;
}

const ContextAwareScrollbar: React.FC<ContextAwareScrollbarProps> = ({
  messages,
  scrollContainerRef,
  contextBoundary,
  currentScrollPercentage = 0,
  onScrollToPercentage
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(currentScrollPercentage);
  const [mousePosition, setMousePosition] = useState<{ y: number; percentage: number } | null>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 监听滚动位置变化
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      const percentage = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
      setScrollPercentage(Math.max(0, Math.min(100, percentage)));
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // 初始化

    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  // 处理点击跳转
  const handleScrollbarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const percentage = (clickY / rect.height) * 100;
    
    if (onScrollToPercentage) {
      onScrollToPercentage(percentage);
    } else {
      // 默认滚动行为
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const { scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      const targetScroll = (percentage / 100) * maxScroll;
      
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [onScrollToPercentage, scrollContainerRef]);

  // 处理拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !scrollbarRef.current) return;
    
    const rect = scrollbarRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(100, (clickY / rect.height) * 100));
    
    if (onScrollToPercentage) {
      onScrollToPercentage(percentage);
    } else {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const { scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      const targetScroll = (percentage / 100) * maxScroll;
      
      container.scrollTop = targetScroll;
    }
  }, [isDragging, onScrollToPercentage, scrollContainerRef]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 处理鼠标移动追踪位置 - 添加轻微防抖以提升性能
  const handleMouseHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollbarRef.current) return;
    
    const rect = scrollbarRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(100, (y / rect.height) * 100));
    
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 设置新的位置更新（轻微延迟以避免过度更新）
    debounceTimerRef.current = setTimeout(() => {
      setMousePosition({ y, percentage });
    }, 16); // 约60fps的更新频率
  }, []);

  if (!messages.length) return null;

  // 计算鼠标位置对应的动态信息
  const getDynamicContextInfo = useCallback(() => {
    if (!mousePosition || !messages.length) return null;
    
    // 根据鼠标位置百分比计算对应的消息索引
    const targetIndex = Math.floor((mousePosition.percentage / 100) * (messages.length - 1)) + 1;
    const targetMessage = messages[targetIndex];
    
    if (!targetMessage) return null;
    
    // 计算从该位置到最新消息的Token总数
    let tokensFromPosition = 0;
    for (let i = targetIndex; i < messages.length; i++) {
      const msg = messages[i];
      tokensFromPosition += msg.contextInfo?.tokenCount || 0;
    }
    
    // 确定该位置的上下文状态
    const contextStatus = targetMessage.contextInfo?.status || 'inactive';
    const distanceFromWindow = targetMessage.contextInfo?.distanceFromWindow || 0;
    
    return {
      messageIndex: targetIndex,
      message: targetMessage,
      tokensFromPosition,
      contextStatus,
      distanceFromWindow,
      totalMessages: messages.length
    };
  }, [mousePosition, messages]);

  const dynamicInfo = getDynamicContextInfo();

  // 计算信息面板的最佳位置
  const calculatePanelPosition = useCallback(() => {
    if (!mousePosition || !scrollbarRef.current) {
      return { 
        top: 0, 
        left: 0, 
        right: 'auto',
        transform: 'none'
      };
    }

    const scrollbarRect = scrollbarRef.current.getBoundingClientRect();
    const parentContainer = scrollbarRef.current.parentElement;
    if (!parentContainer) {
      return { 
        top: 0, 
        left: 0, 
        right: 'auto',
        transform: 'none'
      };
    }
    
    const parentRect = parentContainer.getBoundingClientRect();
    
    // 获取面板实际尺寸，如果无法获取则使用默认值
    const isMobile = window.innerWidth < 640;
    let panelHeight = isMobile ? 180 : 200;
    let panelWidth = isMobile ? 250 : 280;
    
    // 如果面板已渲染，使用实际尺寸
    if (panelRef.current) {
      const panelRect = panelRef.current.getBoundingClientRect();
      if (panelRect.height > 0) panelHeight = panelRect.height;
      if (panelRect.width > 0) panelWidth = panelRect.width;
    }
    const padding = 12;
    const offsetFromCursor = 16;

    // 计算鼠标在父容器中的绝对位置
    const mouseYInParent = mousePosition.y + (scrollbarRect.top - parentRect.top);
    
    // 计算垂直位置
    let top = mouseYInParent + offsetFromCursor;
    
    // 边界检测 - 相对于父容器
    const availableSpaceBelow = parentRect.height - mouseYInParent;
    const availableSpaceAbove = mouseYInParent;
    
    if (availableSpaceBelow < panelHeight + padding && availableSpaceAbove > panelHeight + padding) {
      // 显示在鼠标上方
      top = mouseYInParent - panelHeight - offsetFromCursor;
    } else if (availableSpaceBelow < panelHeight + padding) {
      // 贴底部显示
      top = parentRect.height - panelHeight - padding;
    }
    
    // 确保不超出顶部
    top = Math.max(padding, top);

    // 计算水平位置 - 相对于视口，确保面板始终在视口内
    const scrollbarRightEdge = scrollbarRect.right;
    const scrollbarLeftEdge = scrollbarRect.left;
    const viewportWidth = window.innerWidth;
    
    const spaceOnRight = viewportWidth - scrollbarRightEdge;
    const spaceOnLeft = scrollbarLeftEdge;
    
    let left: number | 'auto' = 'auto';
    let right: number | 'auto' = 'auto';
    
    if (spaceOnRight >= panelWidth + padding) {
      // 显示在右侧
      left = scrollbarRightEdge + padding;
    } else if (spaceOnLeft >= panelWidth + padding) {
      // 显示在左侧
      right = viewportWidth - scrollbarLeftEdge + padding;
    } else {
      // 空间都不足，选择较大的一侧，并确保不超出视口
      if (spaceOnRight > spaceOnLeft) {
        left = Math.max(padding, viewportWidth - panelWidth - padding);
      } else {
        left = padding;
      }
    }

    return {
      top,
      left,
      right,
      transform: 'none'
    };
  }, [mousePosition]);

  // 获取智能提醒信息
  const getSmartReminder = useCallback(() => {
    if (!dynamicInfo) return null;
    
    const { contextStatus, distanceFromWindow, tokensFromPosition } = dynamicInfo;
    
    // 位置相关提醒
    let positionTip = '';
    let tipColor = '';
    let tipIcon = '';
    
    if (contextStatus === 'active') {
      positionTip = '✅ 此位置的消息在当前上下文窗口中';
      tipColor = 'text-green-400';
      tipIcon = '🎯';
    } else if (contextStatus === 'fading') {
      positionTip = '⚠️ 此位置的消息正在淡出上下文';
      tipColor = 'text-yellow-400';
      tipIcon = '🌅';
    } else {
      positionTip = '❌ 此位置的消息已超出上下文窗口';
      tipColor = 'text-red-400';
      tipIcon = '📚';
    }
    
    // 操作建议
    let actionTip = '';
    if (contextStatus === 'inactive' && distanceFromWindow > 1000) {
      actionTip = '建议开启新对话，当前位置距离上下文窗口太远';
    } else if (contextStatus === 'fading') {
      actionTip = '这些消息可能影响AI回复的准确性';
    } else if (tokensFromPosition > 3000) {
      actionTip = '从此位置开始Token较多，考虑精简内容';
    }
    
    return {
      positionTip,
      tipColor,
      tipIcon,
      actionTip
    };
  }, [dynamicInfo]);

  // 计算视口高度（当前可见区域在整个内容中的比例）
  const viewportHeight = scrollContainerRef.current 
    ? (scrollContainerRef.current.clientHeight / scrollContainerRef.current.scrollHeight) * 100
    : 10;

  return (
    <div className="absolute right-1 top-1 bottom-1 w-16 flex flex-col items-end group z-20">
      {/* 主滚动条容器 */}
      <div 
        ref={scrollbarRef}
        className={`relative w-2 h-full bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-full cursor-pointer transition-all duration-200 shadow-sm ${
          isHovered || isDragging ? 'w-3 bg-gray-300/90 dark:bg-gray-600/90 shadow-md' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setMousePosition(null);
        }}
        onMouseMove={handleMouseHover}
        onClick={handleScrollbarClick}
      >
        {/* 层级1：背景层 */}
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 rounded-full" />
        
        {/* 层级2：当前视口指示器（需要先渲染，在遮罩层下面） */}
        <div
          className={`absolute bg-white dark:bg-gray-500 rounded-full transition-all duration-150 border border-white/20 ${
            isHovered || isDragging ? 'w-3 shadow-lg scale-110' : 'w-2 shadow-md'
          }`}
          style={{
            top: `${scrollPercentage}%`,
            height: `${Math.max(4, viewportHeight)}%`,
            minHeight: '16px',
            transform: 'translateY(-50%)',
            cursor: isDragging ? 'grabbing' : 'grab',
            zIndex: 1
          }}
          onMouseDown={handleMouseDown}
        />
        
        {/* 层级3：历史消息遮罩层（最上层） */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
          {contextBoundary && (
            <>
              {/* 上下文窗口之前的历史消息遮罩 */}
              {contextBoundary.startPercentage > 0 && (
                <div
                  className="absolute left-0 right-0 top-0 bg-gradient-to-b from-red-600 to-red-600/50 dark:from-gray-900/90 dark:to-gray-800/70"
                  style={{
                    height: `${contextBoundary.startPercentage}%`
                  }}
                />
              )}
              
              {/* 上下文窗口之后的历史消息遮罩（如果有） */}
              {/* {contextBoundary.endPercentage < 100 && (
                <div
                  className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-gray-600/80 to-gray-500/60 dark:from-gray-900/90 dark:to-gray-800/70"
                  style={{
                    height: `${100 - contextBoundary.endPercentage}%`
                  }}
                />
              )} */}
              
              {/* 上边界线 */}
              {/* <div
                className="absolute left-0 right-0 bg-red-500 dark:bg-red-400 shadow-sm transition-all duration-200"
                style={{
                  top: `${contextBoundary.startPercentage}%`,
                  height: isHovered || isDragging ? '2px' : '1px',
                  boxShadow: '0 0 4px rgba(239, 68, 68, 0.5)'
                }}
                title="上下文窗口开始"
              /> */}
              
              {/* 下边界线（如果不是100%） */}
              {/* {contextBoundary.endPercentage < 100 && (
                <div
                  className="absolute left-0 right-0 bg-red-500 dark:bg-red-400 shadow-sm transition-all duration-200"
                  style={{
                    top: `${contextBoundary.endPercentage}%`,
                    height: isHovered || isDragging ? '2px' : '1px',
                    boxShadow: '0 0 4px rgba(239, 68, 68, 0.5)'
                  }}
                  title="上下文窗口结束"
                />
              )} */}
            </>
          )}
        </div>

        {/* 鼠标位置指示器 */}
        {mousePosition && (
          <div
            className="absolute left-0 right-0 bg-blue-400 border border-blue-300 shadow-lg"
            style={{
              top: `${mousePosition.percentage}%`,
              height: '2px',
              transform: 'translateY(-50%)',
              zIndex: 3
            }}
          />
        )}
      </div>

      {/* 上下文信息面板（hover时显示） */}
      {(isHovered || isDragging) && (() => {
        const panelPosition = calculatePanelPosition();
        
        return (
          <div 
            ref={panelRef}
            className="fixed bg-black/95 dark:bg-gray-800/95 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg shadow-2xl border border-white/10 z-50 max-w-xs sm:max-w-sm transition-all duration-200 ease-out"
            style={{
              top: `${panelPosition.top}px`,
              left: panelPosition.left === 'auto' ? 'auto' : `${panelPosition.left}px`,
              right: panelPosition.right === 'auto' ? 'auto' : `${panelPosition.right}px`,
              transform: panelPosition.transform
            }}
          >

          
          {/* 动态位置信息 */}
          {dynamicInfo && (() => {
            const smartReminder = getSmartReminder();
            return (
              <div className="space-y-2">
                {/* 鼠标位置信息 */}
                <div className="bg-gray-700/50 rounded px-2 py-1">
                  <div className="text-lg">
                    {(dynamicInfo.tokensFromPosition / 1000).toFixed(1)}k 
                  </div>
                </div>

                {/* 智能提醒 */}
                {smartReminder?.actionTip && (
                  <div className="bg-yellow-900/30 border border-yellow-500/30 rounded px-2 py-1">

                    <div className="text-yellow-200 text-xs leading-tight">
                      {smartReminder.actionTip}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          

        </div>
        );
      })()}
    </div>
  );
};

export default ContextAwareScrollbar;