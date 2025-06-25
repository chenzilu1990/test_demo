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
  const scrollbarRef = useRef<HTMLDivElement>(null);

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

  if (!messages.length) return null;

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
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleScrollbarClick}
      >
        {/* 层级1：背景层 */}
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-full" />
        
        {/* 层级2：当前视口指示器（需要先渲染，在遮罩层下面） */}
        <div
          className={`absolute bg-gradient-to-b from-gray-400 to-gray-400 dark:from-gray-500 dark:to-gray-700 rounded-full transition-all duration-150 border border-white/20 ${
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
                  className="absolute left-0 right-0 top-0 bg-gradient-to-b from-gray-600/80 to-gray-500/60 dark:from-gray-900/90 dark:to-gray-800/70"
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

        {/* 消息密度指示器（hover时显示） */}
        {/* {(isHovered || isDragging) && messages.map((msg, index) => {
          const percentage = (index / Math.max(1, messages.length - 1)) * 100;
          const status = msg.contextInfo?.status || 'inactive';
          
          return (
            <div
              key={msg.id}
              className={`absolute w-1 h-px left-1/2 transform -translate-x-1/2 transition-opacity duration-150 ${
                status === 'active' ? 'bg-green-500' :
                status === 'fading' ? 'bg-yellow-500' : 'bg-gray-400'
              }`}
              style={{
                top: `${percentage}%`,
                opacity: status === 'inactive' ? 0.3 : 0.8
              }}
            />
          );
        })} */}
      </div>

      {/* 上下文信息面板（hover时显示） */}
      {(isHovered || isDragging) && (
        <div className="absolute right-6 top-0 bg-black/95 dark:bg-gray-800/95 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg shadow-2xl border border-white/10 whitespace-nowrap animate-in slide-in-from-right-2 duration-200 z-30">
          <div className="font-semibold mb-2 text-blue-300">📊 上下文感知滚动条</div>
          
          <div className="space-y-1">
            <div>总消息: {messages.length}</div>
            
            {contextBoundary && (
              <>
                <div>上下文范围: {contextBoundary.endIndex - contextBoundary.startIndex + 1} 条</div>
                <div className="text-yellow-400">
                  边界: 第 {contextBoundary.startIndex + 1} - {contextBoundary.endIndex + 1} 条
                </div>
              </>
            )}
            
            <div>当前位置: {Math.round(scrollPercentage)}%</div>
            
            <div className="border-t border-white/20 pt-2 mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-gray-100 dark:bg-gray-800 rounded"></div>
                <span>上下文窗口</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-gray-500/70 rounded"></div>
                <span>历史消息</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-red-500 rounded"></div>
                <span>窗口边界</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-2 bg-blue-500 rounded"></div>
                <span>当前视口</span>
              </div>
            </div>
            
            <div className="text-xs opacity-75 mt-2">
              点击或拖拽跳转到任意位置
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextAwareScrollbar;