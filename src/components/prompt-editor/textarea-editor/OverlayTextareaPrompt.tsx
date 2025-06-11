import { useRef, useEffect, useState, useCallback, forwardRef } from 'react';
import { SelectedOption, BracketFormatConfig } from '../types';
import TextareaPrompt from './TextareaPrompt';

interface OverlayTextareaPromptProps {
  value: string;
  onChange: (value: string) => void;
  selectedOptions: SelectedOption[];
  onSelectedOptionsChange: (options: SelectedOption[]) => void;
  brackets: Array<{content: string, start: number, end: number, formatConfig?: BracketFormatConfig}>;
  onBracketClick: (bracketContent: string, startPos: number, endPos: number) => void;
  onSelectedOptionClick: (selectedOption: SelectedOption) => void;
  placeholder?: string;
  height?: string;
  computeTextDiff: (oldText: string, newText: string) => Map<number, number>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

interface TextPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const OverlayTextareaPrompt = forwardRef<HTMLTextAreaElement, OverlayTextareaPromptProps>(({
  value,
  onChange,
  selectedOptions,
  onSelectedOptionsChange,
  brackets,
  onBracketClick,
  onSelectedOptionClick,
  placeholder = "在这里输入您的问题或指令...",
  height = "12rem",
  computeTextDiff,
  onKeyDown
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
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

  // 计算文本位置（考虑自动换行）
  const calculateTextPosition = useCallback((start: number, end: number): TextPosition => {
    if (!ref || typeof ref === 'function' || !ref.current) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const textarea = ref.current;
    const style = window.getComputedStyle(textarea);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const borderTopWidth = parseFloat(style.borderTopWidth) || 0;
    const borderLeftWidth = parseFloat(style.borderLeftWidth) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const borderRightWidth = parseFloat(style.borderRightWidth) || 0;

    // 获取滚动位置
    const scrollTop = textarea.scrollTop;
    const scrollLeft = textarea.scrollLeft;

    // 计算textarea的实际可用宽度
    const availableWidth = textarea.clientWidth - paddingLeft - paddingRight - borderLeftWidth - borderRightWidth;
    
    // 获取文本内容到指定位置
    const textBeforeStart = value.substring(0, start);
    const selectedText = value.substring(start, end);

    // 模拟文本布局，考虑自动换行
    const simulateTextLayout = (text: string) => {
      const lines: string[] = [];
      let currentLine = '';
      let currentLineWidth = 0;
      
      // 获取CSS样式以确定换行行为
      const wordBreak = style.wordBreak || 'normal';
      const whiteSpace = style.whiteSpace || 'pre-wrap';
      const wordWrap = style.wordWrap || style.overflowWrap || 'normal';
      
      // 按硬换行分割文本
      const paragraphs = text.split('\n');
      
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        
        if (i > 0) {
          // 遇到硬换行，结束当前行
          lines.push(currentLine);
          currentLine = '';
          currentLineWidth = 0;
        }
        
        // 如果whiteSpace是nowrap，不进行自动换行
        if (whiteSpace === 'nowrap' || whiteSpace === 'pre') {
          currentLine = paragraph;
          continue;
        }
        
        // 处理段落中的文本，考虑自动换行
        if (wordBreak === 'break-all') {
          // 按字符分割，任意位置都可以换行
          for (let k = 0; k < paragraph.length; k++) {
            const char = paragraph[k];
            const charWidth = getTextMetrics(char, font).width;
            
            if (currentLineWidth + charWidth <= availableWidth) {
              currentLine += char;
              currentLineWidth += charWidth;
            } else {
              lines.push(currentLine);
              currentLine = char;
              currentLineWidth = charWidth;
            }
          }
        } else {
          // 按单词分割（默认行为）
          const words = paragraph.split(' ');
          
          for (let j = 0; j < words.length; j++) {
            const word = words[j];
            const wordWidth = getTextMetrics(word, font).width;
            const spaceWidth = j > 0 ? getTextMetrics(' ', font).width : 0;
            
            // 检查是否需要换行
            const totalWidth = currentLineWidth + spaceWidth + wordWidth;
            
            if (currentLine === '' || totalWidth <= availableWidth) {
              // 可以添加到当前行
              if (currentLine !== '') {
                currentLine += ' ';
                currentLineWidth += spaceWidth;
              }
              currentLine += word;
              currentLineWidth += wordWidth;
            } else {
              // 需要换行
              if (wordWidth > availableWidth && wordWrap === 'break-word') {
                // 单词太长，需要强制断行
                lines.push(currentLine);
                
                // 将长单词按字符分割
                let remainingWord = word;
                while (remainingWord.length > 0) {
                  let lineChars = '';
                  let lineWidth = 0;
                  
                  for (let k = 0; k < remainingWord.length; k++) {
                    const char = remainingWord[k];
                    const charWidth = getTextMetrics(char, font).width;
                    
                    if (lineWidth + charWidth <= availableWidth) {
                      lineChars += char;
                      lineWidth += charWidth;
                    } else {
                      break;
                    }
                  }
                  
                  if (lineChars.length === 0) {
                    // 连一个字符都放不下，至少放一个字符
                    lineChars = remainingWord[0];
                    remainingWord = remainingWord.slice(1);
                  } else {
                    remainingWord = remainingWord.slice(lineChars.length);
                  }
                  
                  if (remainingWord.length === 0) {
                    currentLine = lineChars;
                    currentLineWidth = getTextMetrics(lineChars, font).width;
                  } else {
                    lines.push(lineChars);
                  }
                }
              } else {
                // 正常换行
                lines.push(currentLine);
                currentLine = word;
                currentLineWidth = wordWidth;
              }
            }
          }
        }
      }
      
      // 添加最后一行
      if (currentLine !== '' || text.endsWith('\n')) {
        lines.push(currentLine);
      }
      
      return lines;
    };

    // 模拟文本布局到start位置
    const layoutLines = simulateTextLayout(textBeforeStart);
    
    // 计算start位置的坐标
    const startLine = Math.max(0, layoutLines.length - 1);
    const textInStartLine = layoutLines[startLine] || '';
    const startX = getTextMetrics(textInStartLine, font).width;

    // 计算选中文本的宽度
    // 需要考虑选中文本可能跨行的情况
    let selectedWidth = 0;
    if (selectedText.includes('\n') || startX + getTextMetrics(selectedText, font).width > availableWidth) {
      // 选中文本跨行或者超出当前行宽度，需要特殊处理
      const selectionLines = simulateTextLayout(value.substring(0, end));
      const endLine = Math.max(0, selectionLines.length - 1);
      
      if (startLine === endLine) {
        // 在同一行内
        selectedWidth = getTextMetrics(selectedText, font).width;
      } else {
        // 跨行选择，使用第一行的剩余宽度
        const remainingWidth = availableWidth - startX;
        selectedWidth = Math.min(remainingWidth, getTextMetrics(selectedText, font).width);
      }
    } else {
      selectedWidth = getTextMetrics(selectedText, font).width;
    }

    return {
      x: paddingLeft + borderLeftWidth + startX - scrollLeft,
      y: paddingTop + borderTopWidth + startLine * lineHeight - scrollTop,
      width: Math.max(selectedWidth, 20), // 确保最小宽度
      height: lineHeight
    };
  }, [value, getTextMetrics, ref]);

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
    
    if (ref && typeof ref !== 'function' && ref.current) {
      const textarea = ref.current;
      textarea.addEventListener('scroll', handleScroll);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        textarea.removeEventListener('scroll', handleScroll);
        if (updateTimeoutRef.current) {
          cancelAnimationFrame(updateTimeoutRef.current);
        }
      };
    } else {
      return () => {
        window.removeEventListener('resize', handleResize);
        if (updateTimeoutRef.current) {
          cancelAnimationFrame(updateTimeoutRef.current);
        }
      };
    }
  }, [updateOverlayElements, ref]);

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
        ref={ref}
        value={value}
        onChange={onChange}
        selectedOptions={selectedOptions}
        onSelectedOptionsChange={onSelectedOptionsChange}
        placeholder={placeholder}
        height={height}
        computeTextDiff={computeTextDiff}
        onKeyDown={onKeyDown}
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
                ? element.data.formatConfig?.className || 'text-blue-500 hover:bg-blue-100/50 dark:hover:bg-blue-900/50'
                : 'bg-green-100/50 dark:bg-green-800/70 text-green-800 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-700'
            }`}
            style={{
              left: `${element.position.x}px`,
              top: `${element.position.y}px`,
              width: `${Math.max(element.position.width, 20)}px`,
              height: `${element.position.height}px`,
              lineHeight: `${element.position.height}px`,
              fontSize: ref && typeof ref !== 'function' && ref.current ? window.getComputedStyle(ref.current).fontSize : 'inherit',
              fontFamily: ref && typeof ref !== 'function' && ref.current ? window.getComputedStyle(ref.current).fontFamily : 'inherit',
              fontWeight: ref && typeof ref !== 'function' && ref.current ? window.getComputedStyle(ref.current).fontWeight : 'inherit',
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
            {element.type === 'bracket' ? value.substring(element.start, element.end) : element.content}
          </div>
        ))}
      </div>
    </div>
  );
});

OverlayTextareaPrompt.displayName = 'OverlayTextareaPrompt';

export default OverlayTextareaPrompt;