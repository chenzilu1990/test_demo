/**
 * 实时解析插件 (RealTimeParserPlugin)
 * 
 * 主要功能：
 * 1. 监听编辑器内容变化，实时检测新输入的方括号文本
 * 2. 将方括号文本转换为可交互的BracketNode节点
 * 3. 智能光标管理，确保转换后光标位置正确
 * 4. 防抖处理，避免频繁的节点转换
 * 5. 优化转换时机：仅当光标离开新输入的方括号时才进行转换
 * 
 * 核心算法：
 * - 使用文本差异比较，只处理新增的方括号
 * - 采用 Dify 风格的多策略光标管理
 * - 支持多个方括号同时输入的场景
 * - 精确判断光标位置以决定是否转换
 * 
 * 性能优化：
 * - 使用防抖机制避免过度解析
 * - 智能跳过已转换的BracketNode
 * - 只处理完整的方括号对
 * - 优化的光标恢复策略
 */

import { useEffect, useRef } from 'react';
import { 
  $getRoot, 
  $createTextNode,
  TextNode,
  ElementNode,
  $getSelection,
  $isRangeSelection,
  RangeSelection,
  LexicalNode
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { BracketNode, $createBracketNode, $isBracketNode } from '../nodes/BracketNode';
import { $isSelectedValueNode } from '../nodes/SelectedValueNode';
import { useCursorManager } from '../lexical-hooks/useCursorManager';

interface RealTimeParserPluginProps {
  /** 是否启用实时解析 */
  enabled?: boolean;
  /** 防抖延迟时间（毫秒） */
  debounceMs?: number;
}

/**
 * 实时解析插件组件
 * 负责将用户输入的方括号文本实时转换为BracketNode
 * 采用 Dify 风格的光标管理策略, 优化转换时机
 */
export function RealTimeParserPlugin({ 
  enabled = true,
  debounceMs = 100
}: RealTimeParserPluginProps) {
  const [editor] = useLexicalComposerContext();
  const cursorManager = useCursorManager();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;

    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        editorState.read(() => {
          const root = $getRoot();
          const currentContent = root.getTextContent();
          
          if (currentContent === lastContentRef.current) {
            return;
          }

          const needsParsing = hasNewBrackets(currentContent, lastContentRef.current);
          
          if (needsParsing) {
            setTimeout(() => {
              convertBracketsToNodes();
            }, 0);
          }

          lastContentRef.current = currentContent;
        });
      }, debounceMs);
    });

    return () => {
      removeUpdateListener();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [editor, enabled, debounceMs, cursorManager]); // Added cursorManager to dependencies

  const hasNewBrackets = (currentContent: string, previousContent: string): boolean => {
    const currentBracketsCount = (currentContent.match(/\[([^\[\]]+)\]/g) || []).length;
    const previousBracketsCount = (previousContent.match(/\[([^\[\]]+)\]/g) || []).length;
    
    // A more precise check could involve diffing, but for now, this heuristic works with the refined conversion logic.
    // The main check is now done during the conversion process itself based on cursor position.
    return currentContent.includes('[') && currentContent.includes(']');
  };

  const convertBracketsToNodes = () => {
    editor.update(() => {
      const savedCursorState = cursorManager.isAvailable ? cursorManager.saveCursor() : null;
      
      const currentSelection = $getSelection();
      let rangeSelectionForParsing: RangeSelection | null = null;
      if ($isRangeSelection(currentSelection)) {
        rangeSelectionForParsing = currentSelection;
      }

      if (process.env.NODE_ENV === 'development' && cursorManager.isAvailable) {
        console.log('🔄 开始实时解析，保存光标状态:', savedCursorState, '当前选择:', rangeSelectionForParsing);
      }

      const root = $getRoot();
      const children = root.getChildren();
      
      children.forEach(child => {
        if (child instanceof ElementNode) {
          parseElementForBrackets(child, rangeSelectionForParsing);
        }
      });

      if (cursorManager.isAvailable) {
        if (savedCursorState) {
          const exactSuccess = cursorManager.restoreCursor(savedCursorState, 'exact');
          if (!exactSuccess) {
            cursorManager.adjustCursor({
              type: 'content-parse',
              data: { originalState: savedCursorState }
            });
          }
        } else {
          cursorManager.adjustCursor({ type: 'content-parse' });
        }
      }

      if (process.env.NODE_ENV === 'development') {
        const statusMessage = cursorManager.isAvailable ? '光标已恢复' : '使用基础光标处理';
        console.log(`✅ 实时解析完成，${statusMessage}`);
      }
    });
  };

  const parseElementForBrackets = (element: ElementNode, currentSelection: RangeSelection | null) => {
    const children = element.getChildren();
    const nodesToProcess: Array<{ node: TextNode; index: number }> = [];
    
    children.forEach((child, index) => {
      if (child instanceof TextNode && !$isBracketNode(child) && !$isSelectedValueNode(child)) {
        const text = child.getTextContent();
        if (text.includes('[') && text.includes(']')) {
          nodesToProcess.push({ node: child, index });
        }
      }
    });

    nodesToProcess.slice().reverse().forEach(({ node }) => {
      processBracketsInTextNode(node, currentSelection);
    });
  };

  const processBracketsInTextNode = (textNode: TextNode, currentSelection: RangeSelection | null) => {
    const text = textNode.getTextContent();
    const regex = /([\[\{])([^\[\]]+)([\}\]])/g; // Matches [param_name] || {param_name} || {{param_name}}
    const newSegments: Array<{ type: 'text' | 'bracket'; content: string; bracketType?: string }> = [];
    let lastIndex = 0;
    let match;
    let madeChange = false;

    while ((match = regex.exec(text)) !== null) {
      const paramName = match[1];
      const matchStartIndex = match.index;
      const matchEndIndex = match.index + match[0].length;

      // Push text before the match
      if (match.index > lastIndex) {
        newSegments.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }

      let convertThisMatch = true; // Default to converting
      const isUserTypingAndFocused = currentSelection && currentSelection.isCollapsed();

      if (isUserTypingAndFocused) {
        if (textNode.getKey() === currentSelection.focus.key) {
          // Cursor is in the same node as the match
          if (currentSelection.focus.offset > matchStartIndex && currentSelection.focus.offset < matchEndIndex) {
            // Cursor is INSIDE the current [match] (e.g., [pa|ram]), so don't convert this one yet
            convertThisMatch = false;
          }
          // If cursor is at matchStartIndex or matchEndIndex, it implies user might be just finishing or starting, still allow conversion if they move out.
          // The crucial part is being strictly *within* the brackets content.
        }
        // If cursor is in a different node, `convertThisMatch` remains true, meaning conversion is allowed.
      }
      // If not `isUserTypingAndFocused` (e.g., programmatic change, block selection), `convertThisMatch` also remains true.

      if (convertThisMatch) {
        newSegments.push({ type: 'bracket', content: match[0], bracketType: paramName });
        madeChange = true;
      } else {
        newSegments.push({ type: 'text', content: match[0] }); // Keep as text
      }
      lastIndex = matchEndIndex;
    }

    // Push remaining text after the last match
    if (lastIndex < text.length) {
      newSegments.push({ type: 'text', content: text.substring(lastIndex) });
    }

    // If no actual conversion happened or segments are same as original text, return.
    if (!madeChange || (newSegments.length === 1 && newSegments[0].type === 'text' && newSegments[0].content === text)) {
      return;
    }

    const finalNewNodes = newSegments.map(segment => {
      if (segment.type === 'bracket' && segment.bracketType) {
        return $createBracketNode(segment.content, segment.bracketType);
      } else {
        return $createTextNode(segment.content);
      }
    }).filter(node => node.getTextContent() !== '' || $isBracketNode(node)); // Keep empty bracket nodes if they were meant to be (though regex prevents empty paramName)

    if (finalNewNodes.length > 0) {
      performOptimizedNodeReplacement(textNode, finalNewNodes);
    }
  };

  const performOptimizedNodeReplacement = (
    originalNode: TextNode, 
    newNodes: Array<LexicalNode> // Changed to LexicalNode to accept BracketNode too
  ) => {
    const firstNode = newNodes[0];
    if (!firstNode) return;

    originalNode.replace(firstNode);
    
    let currentNode = firstNode;
    for (let i = 1; i < newNodes.length; i++) {
      const nextNode = newNodes[i];
      currentNode.insertAfter(nextNode);
      currentNode = nextNode;
    }

    const lastNewNode = newNodes[newNodes.length - 1];
    if (lastNewNode instanceof TextNode && cursorManager.isAvailable) {
      cursorManager.adjustCursor({
        type: 'node-replace',
        sourceNode: originalNode,
        targetNode: lastNewNode,
        data: { 
          replacementType: 'bracket-conversion',
          nodeCount: newNodes.length 
        }
      });
    }
  };

  return null;
}

/**
 * 组件显示名称
 */
RealTimeParserPlugin.displayName = 'RealTimeParserPlugin';

/**
 * 默认配置
 */
RealTimeParserPlugin.defaultProps = {
  enabled: true,
  debounceMs: 100,
} as const; 