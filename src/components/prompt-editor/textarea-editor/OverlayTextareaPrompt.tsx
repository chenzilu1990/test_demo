import { useRef, useEffect, useState, useCallback } from 'react';
import { SelectedOption } from '../types';
import TextareaPrompt from './TextareaPrompt';

interface OverlayTextareaPromptProps {
  value: string;
  onChange: (value: string) => void;
  selectedOptions: SelectedOption[];
  onSelectedOptionsChange: (options: SelectedOption[]) => void;
  brackets: Array<{content: string, start: number, end: number}>;
  onBracketClick: (bracketContent: string, startPos: number, endPos: number) => void;
  onSelectedOptionClick: (selectedOption: SelectedOption) => void;
  placeholder?: string;
  height?: string;
  computeTextDiff: (oldText: string, newText: string) => Map<number, number>;
}

interface TextPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function OverlayTextareaPrompt({
  value,
  onChange,
  selectedOptions,
  onSelectedOptionsChange,
  brackets,
  onBracketClick,
  onSelectedOptionClick,
  placeholder = "在这里输入您的问题或指令...",
  height = "12rem",
  computeTextDiff
}: OverlayTextareaPromptProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);
  const [overlayElements, setOverlayElements] = useState<Array<{
    id: string;
    type: 'bracket' | 'selected';
    content: string;
    position: TextPosition;
    start: number;
    end: number;
    data: any;
  }>>([]);

  // 创建用于测量文本的 canvas
  const getTextMetrics = useCallback((text: string, font: string) => {
    if (!measureCanvasRef.current) {
      measureCanvasRef.current = document.createElement('canvas');
    }
    const ctx = measureCanvasRef.current.getContext('2d');
    if (ctx) {
      ctx.font = font;
      return ctx.measureText(text);
    }
    return { width: 0 };
  }, []);

  // 计算文本位置
  const calculateTextPosition = useCallback((start: number, end: number): TextPosition => {
    if (!textareaRef.current) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const textarea = textareaRef.current;
    const style = window.getComputedStyle(textarea);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const borderTopWidth = parseFloat(style.borderTopWidth) || 0;
    const borderLeftWidth = parseFloat(style.borderLeftWidth) || 0;

    // 获取滚动位置
    const scrollTop = textarea.scrollTop;
    const scrollLeft = textarea.scrollLeft;

    // 获取文本内容到指定位置
    const textBeforeStart = value.substring(0, start);
    const selectedText = value.substring(start, end);

    // 计算行数和每行内容
    const lines = textBeforeStart.split('\n');
    const currentLine = lines.length - 1;
    const textInCurrentLine = lines[lines.length - 1];

    // 计算 x 位置（当前行的文本宽度）
    const textWidth = getTextMetrics(textInCurrentLine, font).width;
    const selectedWidth = getTextMetrics(selectedText, font).width;

    return {
      x: paddingLeft + borderLeftWidth + textWidth - scrollLeft,
      y: paddingTop + borderTopWidth + currentLine * lineHeight - scrollTop,
      width: selectedWidth,
      height: lineHeight
    };
  }, [value, getTextMetrics]);

  // 更新覆盖元素位置（节流版本）
  const updateOverlayElements = useCallback(() => {
    if (updateTimeoutRef.current) {
      cancelAnimationFrame(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = requestAnimationFrame(() => {
      const elements: typeof overlayElements = [];

      // 处理方括号
      brackets.forEach((bracket, index) => {
        // 检查是否已被选择项覆盖
        const isOverlapped = selectedOptions.some(option => 
          option.position.start <= bracket.start && option.position.end >= bracket.end
        );

        if (!isOverlapped) {
          const position = calculateTextPosition(bracket.start, bracket.end);
          elements.push({
            id: `bracket-${index}`,
            type: 'bracket',
            content: bracket.content,
            position,
            start: bracket.start,
            end: bracket.end,
            data: bracket
          });
        }
      });

      // 处理已选择的选项
      selectedOptions.forEach((option) => {
        const position = calculateTextPosition(option.position.start, option.position.end);
        elements.push({
          id: `selected-${option.id}`,
          type: 'selected',
          content: option.selectedValue,
          position,
          start: option.position.start,
          end: option.position.end,
          data: option
        });
      });

      setOverlayElements(elements);
    });
  }, [brackets, selectedOptions, calculateTextPosition]);

  // 监听文本变化、窗口大小变化和滚动
  useEffect(() => {
    updateOverlayElements();
  }, [updateOverlayElements]);

  useEffect(() => {
    const handleResize = () => {
      updateOverlayElements();
    };
    
    const handleScroll = () => {
      updateOverlayElements();
    };

    window.addEventListener('resize', handleResize);
    
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (textarea) {
        textarea.removeEventListener('scroll', handleScroll);
      }
      if (updateTimeoutRef.current) {
        cancelAnimationFrame(updateTimeoutRef.current);
      }
    };
  }, [updateOverlayElements]);

  // 处理覆盖层点击
  const handleOverlayClick = (element: typeof overlayElements[0]) => {
    if (element.type === 'bracket') {
      onBracketClick(element.data.content, element.start, element.end);
    } else if (element.type === 'selected') {
      onSelectedOptionClick(element.data);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* 原始的 TextareaPrompt 组件 */}
      <TextareaPrompt
        ref={textareaRef}
        value={value}
        onChange={onChange}
        selectedOptions={selectedOptions}
        onSelectedOptionsChange={onSelectedOptionsChange}
        placeholder={placeholder}
        height={height}
        computeTextDiff={computeTextDiff}
      />

      {/* 覆盖层 */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {overlayElements.map((element) => (
          <div
            key={element.id}
            className={`absolute pointer-events-auto cursor-pointer rounded-sm transition-all duration-150 ${
              element.type === 'bracket'
                ? 'text-blue-500 hover:bg-blue-100/50 dark:hover:bg-blue-900/50'
                : 'bg-green-100/50 dark:bg-green-800/70 text-green-800 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-700'
            }`}
                          style={{
                left: `${element.position.x}px`,
                top: `${element.position.y}px`,
                width: `${Math.max(element.position.width, 20)}px`,
                height: `${element.position.height}px`,
                lineHeight: `${element.position.height}px`,
                fontSize: textareaRef.current ? window.getComputedStyle(textareaRef.current).fontSize : 'inherit',
                fontFamily: textareaRef.current ? window.getComputedStyle(textareaRef.current).fontFamily : 'inherit',
                fontWeight: textareaRef.current ? window.getComputedStyle(textareaRef.current).fontWeight : 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                zIndex: 10
              }}
            onClick={() => handleOverlayClick(element)}
            title={
              element.type === 'bracket' 
                ? `点击选择 [${element.content}]` 
                : `点击重新选择 ${element.data.type}`
            }
          >
            {element.type === 'bracket' ? `[${element.content}]` : element.content}
          </div>
        ))}
      </div>
    </div>
  );
}