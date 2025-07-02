import React, { useEffect, useState, useCallback, useRef } from 'react';

interface SimpleScrollbarProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  contextTopOffset: number;
  contextLengthTopOffset: number;
}

const SimpleScrollbar: React.FC<SimpleScrollbarProps> = ({
  scrollContainerRef,
  contextTopOffset,
  contextLengthTopOffset = -10,
}) => {
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
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
    
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const { scrollHeight, clientHeight } = container;
    const maxScroll = scrollHeight - clientHeight;
    const targetScroll = (percentage / 100) * maxScroll;
    
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }, [scrollContainerRef]);

  // 处理拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !scrollbarRef.current) return;
    
    const rect = scrollbarRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(100, (clickY / rect.height) * 100));
    
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const { scrollHeight, clientHeight } = container;
    const maxScroll = scrollHeight - clientHeight;
    const targetScroll = (percentage / 100) * maxScroll;
    
    container.scrollTop = targetScroll;
  }, [isDragging, scrollContainerRef]);

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

  const handleMouseHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = scrollbarRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickY = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(100, (clickY / rect.height) * 100));
    setScrollPercentage(percentage);
  }, []);


  // 计算视口高度（当前可见区域在整个内容中的比例）
  const viewportHeight = scrollContainerRef.current 
    ? (scrollContainerRef.current.clientHeight / scrollContainerRef.current.scrollHeight) * 100
    : 10;

  // 如果内容不需要滚动，不显示滚动条
  if (viewportHeight >= 100) return null;

  return (
    <div className="absolute right-4 top-0 bottom-0 w-3">
      {/* 滚动条轨道 */}
      <div
        ref={scrollbarRef}
        className="relative h-full dark:bg-gray-700 rounded-full cursor-pointer"
        onClick={handleScrollbarClick}
      >
        {/* 层级2：上下文指示区 (Indicator) - 代表当前被送入模型的对话上下文 */}
        <div
          className="absolute bg-blue-500/50 dark:bg-gray-700 rounded-b-full w-full"
          style={{
            top: `${contextTopOffset}%`,
            bottom: 0,
          }}
        />
        {/* 层级3：最大上下文阈值线 (Limit Marker) - 代表LLM的固有上下文长度 */}
        <div
          className="absolute bg-red-500 dark:bg-gray-700  w-full "
          style={{
            top: `${contextLengthTopOffset}%`,
            height: "4px",
          }}
        />

        {/* 当前视口指示器（滑块） */}
        <div
          className="absolute bg-gray-500/50 dark:bg-gray-400 rounded-full w-full transition-colors"
          style={{
            top: `${(scrollPercentage * (100 - viewportHeight)) / 100}%`,
            height: `${Math.max(4, viewportHeight)}%`,
            minHeight: "20px",
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
};

export default SimpleScrollbar;