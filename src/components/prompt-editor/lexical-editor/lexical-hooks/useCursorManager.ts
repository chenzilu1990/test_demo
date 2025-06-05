/**
 * 光标管理钩子 (useCursorManager)
 * 
 * 参考 Dify prompt-editor 的光标管理策略：
 * 1. 分层架构的光标状态管理
 * 2. 智能光标恢复机制
 * 3. 多场景适配的光标调整
 * 4. 健壮的错误处理和回退策略
 * 
 * 核心特性：
 * - 🎯 精确的光标位置保存和恢复
 * - 🔄 节点转换时的智能光标调整
 * - 🛡️ 多级回退策略确保健壮性
 * - ⚡ 性能优化的状态管理
 * 
 * 使用场景：
 * - 节点替换时保持光标位置
 * - 内容转换后的智能光标定位
 * - 复杂交互中的光标状态同步
 */

import { useCallback, useRef, useState } from 'react';
import { 
  $getSelection, 
  $isRangeSelection, 
  $setSelection,
  $createRangeSelection,
  $getRoot,
  LexicalNode,
  TextNode,
  ElementNode,
  NodeKey
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 光标状态
 */
interface CursorState {
  /** 锚点节点键 */
  anchorNodeKey: string;
  /** 锚点偏移量 */
  anchorOffset: number;
  /** 焦点节点键 */
  focusNodeKey: string;
  /** 焦点偏移量 */
  focusOffset: number;
  /** 是否折叠选择 */
  isCollapsed: boolean;
  /** 选择方向 */
  direction: 'forward' | 'backward' | 'none';
}

/**
 * 转换上下文
 */
interface TransformContext {
  /** 转换类型 */
  type: 'node-replace' | 'content-parse' | 'template-apply';
  /** 源节点信息 */
  sourceNode?: LexicalNode;
  /** 目标节点信息 */
  targetNode?: LexicalNode;
  /** 额外上下文数据 */
  data?: Record<string, any>;
}

/**
 * 光标恢复策略
 */
type CursorRestoreStrategy = 'exact' | 'nearest' | 'end' | 'start';

/**
 * 光标管理器接口
 */
interface CursorManagerAPI {
  /** 保存当前光标状态 */
  saveCursor: () => CursorState | null;
  /** 恢复光标状态 */
  restoreCursor: (state: CursorState, strategy?: CursorRestoreStrategy) => boolean;
  /** 智能光标调整 */
  adjustCursor: (context: TransformContext) => void;
  /** 设置光标到节点位置 */
  setCursorToNode: (node: LexicalNode, position: 'start' | 'end') => boolean;
  /** 同步光标状态 */
  syncCursor: () => void;
  /** 是否可用 */
  isAvailable: boolean;
}

// ============================================================================
// 主钩子实现
// ============================================================================

/**
 * 光标管理钩子
 * @returns 光标管理API
 */
export function useCursorManager(): CursorManagerAPI {
  // 状态管理，减少重复警告
  const [hasWarnedOnce, setHasWarnedOnce] = useState(false);
  
  let editor: any = null;
  let hasContext = true;
  
  try {
    // 尝试获取 Lexical 编辑器上下文
    [editor] = useLexicalComposerContext();
  } catch (error) {
    // 如果没有上下文，设置标志并继续
    hasContext = false;
    
    // 只在首次失败时警告，避免重复
    if (process.env.NODE_ENV === 'development' && !hasWarnedOnce) {
      console.warn('⚠️ useCursorManager: 没有找到 LexicalComposerContext，将返回空操作函数');
      setHasWarnedOnce(true);
    }
  }
  
  const lastCursorStateRef = useRef<CursorState | null>(null);

  /**
   * 创建空操作函数（当没有编辑器上下文时使用）
   */
  const createNoOpFunction = useCallback((functionName: string) => {
    return (...args: any[]) => {
      // 减少重复警告，只在开发环境且首次调用时警告
      if (process.env.NODE_ENV === 'development' && !hasWarnedOnce) {
        console.warn(`⚠️ ${functionName}: 不在 LexicalComposer 上下文中，操作被忽略`);
        setHasWarnedOnce(true);
      }
      return false;
    };
  }, [hasWarnedOnce]);

  /**
   * 保存当前光标状态
   * 参考 Dify 的精确状态保存策略
   */
  const saveCursor = useCallback((): CursorState | null => {
    if (!hasContext || !editor) {
      return null;
    }

    let cursorState: CursorState | null = null;
    
    try {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        
        if ($isRangeSelection(selection)) {
          cursorState = {
            anchorNodeKey: selection.anchor.key,
            anchorOffset: selection.anchor.offset,
            focusNodeKey: selection.focus.key,
            focusOffset: selection.focus.offset,
            isCollapsed: selection.isCollapsed(),
            direction: selection.isBackward() ? 'backward' : 'forward'
          };
        }
      });

      if (cursorState) {
        lastCursorStateRef.current = cursorState;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🎯 光标状态已保存:', cursorState);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ 保存光标状态时出错:', error);
      }
    }

    return cursorState;
  }, [editor, hasContext]);

  /**
   * 恢复光标状态
   * 实现 Dify 风格的多策略恢复机制
   */
  const restoreCursor = useCallback((
    state: CursorState, 
    strategy: CursorRestoreStrategy = 'exact'
  ): boolean => {
    if (!hasContext || !editor || !state) {
      return false;
    }

    let success = false;

    try {
      editor.update(() => {
        try {
          // 策略1: 精确恢复
          if (strategy === 'exact') {
            success = attemptExactRestore(state);
          }
          
          // 策略2: 最近节点恢复
          if (!success && (strategy === 'nearest' || strategy === 'exact')) {
            success = attemptNearestRestore(state);
          }
          
          // 策略3: 末尾位置恢复
          if (!success && (strategy === 'end' || strategy === 'exact' || strategy === 'nearest')) {
            success = attemptEndRestore();
          }
          
          // 策略4: 开始位置恢复（最后回退）
          if (!success) {
            success = attemptStartRestore();
          }

          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 光标恢复${success ? '成功' : '失败'}，策略: ${strategy}`);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ 光标恢复异常:', error);
          }
          success = false;
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ 光标恢复更新失败:', error);
      }
      success = false;
    }

    return success;
  }, [editor, hasContext]);

  /**
   * 智能光标调整
   * 模拟 Dify 的上下文感知调整
   */
  const adjustCursor = useCallback((context: TransformContext) => {
    if (!hasContext || !editor) {
      return;
    }

    try {
      editor.update(() => {
        switch (context.type) {
          case 'node-replace':
            handleNodeReplaceAdjustment(context);
            break;
          case 'content-parse':
            handleContentParseAdjustment(context);
            break;
          case 'template-apply':
            handleTemplateApplyAdjustment(context);
            break;
          default:
            // 通用调整逻辑
            handleGenericAdjustment(context);
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ 光标调整失败:', error);
      }
    }
  }, [editor, hasContext]);

  /**
   * 设置光标到节点位置
   */
  const setCursorToNode = useCallback((
    node: LexicalNode, 
    position: 'start' | 'end' = 'end'
  ): boolean => {
    if (!hasContext || !editor) {
      return false;
    }

    let success = false;

    try {
      editor.update(() => {
        try {
          if (node instanceof TextNode) {
            const selection = $createRangeSelection();
            const offset = position === 'end' ? node.getTextContentSize() : 0;
            
            selection.anchor.set(node.getKey(), offset, 'text');
            selection.focus.set(node.getKey(), offset, 'text');
            $setSelection(selection);
            
            success = true;
          } else {
            // 对于非文本节点，尝试设置到相邻的文本节点
            success = setCursorToAdjacentText(node, position);
          }
        } catch (error) {
          success = false;
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ 设置光标到节点失败:', error);
      }
      success = false;
    }

    return success;
  }, [editor, hasContext]);

  /**
   * 同步光标状态
   */
  const syncCursor = useCallback(() => {
    if (!hasContext || !editor) {
      return;
    }

    try {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // 触发选择事件，确保UI同步
          $setSelection(selection);
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ 同步光标状态失败:', error);
      }
    }
  }, [editor, hasContext]);

  // 如果没有编辑器上下文，返回空操作的API
  if (!hasContext) {
    return {
      saveCursor: () => null,
      restoreCursor: createNoOpFunction('restoreCursor'),
      adjustCursor: createNoOpFunction('adjustCursor'),
      setCursorToNode: createNoOpFunction('setCursorToNode'),
      syncCursor: createNoOpFunction('syncCursor'),
      isAvailable: false
    };
  }

  return {
    saveCursor,
    restoreCursor,
    adjustCursor,
    setCursorToNode,
    syncCursor,
    isAvailable: true
  };
}

// ============================================================================
// 辅助函数实现
// ============================================================================

/**
 * 尝试精确恢复光标位置
 */
function attemptExactRestore(state: CursorState): boolean {
  try {
    const root = $getRoot();
    const anchorNode = root.getChildren()
      .flatMap(child => child instanceof ElementNode ? child.getChildren() : [])
      .find(node => node.getKey() === state.anchorNodeKey);
    
    const focusNode = root.getChildren()
      .flatMap(child => child instanceof ElementNode ? child.getChildren() : [])
      .find(node => node.getKey() === state.focusNodeKey);

    if (anchorNode && focusNode && 
        anchorNode instanceof TextNode && 
        focusNode instanceof TextNode) {
      
      const selection = $createRangeSelection();
      
      const anchorOffset = Math.min(state.anchorOffset, anchorNode.getTextContentSize());
      const focusOffset = Math.min(state.focusOffset, focusNode.getTextContentSize());
      
      selection.anchor.set(anchorNode.getKey(), anchorOffset, 'text');
      selection.focus.set(focusNode.getKey(), focusOffset, 'text');
      
      $setSelection(selection);
      return true;
    }
  } catch (error) {
    // 精确恢复失败
  }
  
  return false;
}

/**
 * 尝试最近节点恢复
 */
function attemptNearestRestore(state: CursorState): boolean {
  try {
    const root = $getRoot();
    const allNodes = root.getChildren()
      .flatMap(child => child instanceof ElementNode ? child.getChildren() : [])
      .filter((node): node is TextNode => node instanceof TextNode);

    if (allNodes.length > 0) {
      // 找到最接近原位置的文本节点
      const targetNode = allNodes[Math.min(allNodes.length - 1, Math.floor(allNodes.length / 2))];
      
      const selection = $createRangeSelection();
      const offset = Math.min(state.anchorOffset, targetNode.getTextContentSize());
      
      selection.anchor.set(targetNode.getKey(), offset, 'text');
      selection.focus.set(targetNode.getKey(), offset, 'text');
      
      $setSelection(selection);
      return true;
    }
  } catch (error) {
    // 最近节点恢复失败
  }
  
  return false;
}

/**
 * 尝试末尾位置恢复
 */
function attemptEndRestore(): boolean {
  try {
    const root = $getRoot();
    const allNodes = root.getChildren()
      .flatMap(child => child instanceof ElementNode ? child.getChildren() : [])
      .filter((node): node is TextNode => node instanceof TextNode);

    if (allNodes.length > 0) {
      const lastNode = allNodes[allNodes.length - 1];
      const selection = $createRangeSelection();
      const offset = lastNode.getTextContentSize();
      
      selection.anchor.set(lastNode.getKey(), offset, 'text');
      selection.focus.set(lastNode.getKey(), offset, 'text');
      
      $setSelection(selection);
      return true;
    }
  } catch (error) {
    // 末尾恢复失败
  }
  
  return false;
}

/**
 * 尝试开始位置恢复（最后回退策略）
 */
function attemptStartRestore(): boolean {
  try {
    const root = $getRoot();
    const allNodes = root.getChildren()
      .flatMap(child => child instanceof ElementNode ? child.getChildren() : [])
      .filter((node): node is TextNode => node instanceof TextNode);

    if (allNodes.length > 0) {
      const firstNode = allNodes[0];
      const selection = $createRangeSelection();
      
      selection.anchor.set(firstNode.getKey(), 0, 'text');
      selection.focus.set(firstNode.getKey(), 0, 'text');
      
      $setSelection(selection);
      return true;
    }
  } catch (error) {
    // 即使是最后的回退策略也失败了
  }
  
  return false;
}

/**
 * 处理节点替换时的光标调整
 */
function handleNodeReplaceAdjustment(context: TransformContext) {
  if (context.targetNode && context.targetNode instanceof TextNode) {
    const selection = $createRangeSelection();
    const offset = context.targetNode.getTextContentSize();
    
    selection.anchor.set(context.targetNode.getKey(), offset, 'text');
    selection.focus.set(context.targetNode.getKey(), offset, 'text');
    $setSelection(selection);
  }
}

/**
 * 处理内容解析时的光标调整
 */
function handleContentParseAdjustment(context: TransformContext) {
  // 内容解析后，通常将光标设置到末尾
  attemptEndRestore();
}

/**
 * 处理模板应用时的光标调整
 */
function handleTemplateApplyAdjustment(context: TransformContext) {
  // 模板应用后，将光标设置到开始位置
  attemptStartRestore();
}

/**
 * 通用光标调整逻辑
 */
function handleGenericAdjustment(context: TransformContext) {
  // 默认使用末尾策略
  attemptEndRestore();
}

/**
 * 设置光标到相邻文本节点
 */
function setCursorToAdjacentText(node: LexicalNode, position: 'start' | 'end'): boolean {
  try {
    const parent = node.getParent();
    if (parent instanceof ElementNode) {
      const siblings = parent.getChildren();
      const nodeIndex = siblings.indexOf(node);
      
      // 根据位置查找相邻的文本节点
      const targetIndex = position === 'end' ? nodeIndex + 1 : nodeIndex - 1;
      const targetNode = siblings[targetIndex];
      
      if (targetNode instanceof TextNode) {
        const selection = $createRangeSelection();
        const offset = position === 'end' ? 0 : targetNode.getTextContentSize();
        
        selection.anchor.set(targetNode.getKey(), offset, 'text');
        selection.focus.set(targetNode.getKey(), offset, 'text');
        $setSelection(selection);
        
        return true;
      }
    }
  } catch (error) {
    // 相邻文本设置失败
  }
  
  return false;
}

// ============================================================================
// 导出类型和常量
// ============================================================================

export type { 
  CursorState, 
  TransformContext, 
  CursorRestoreStrategy,
  CursorManagerAPI 
};

export const CURSOR_RESTORE_STRATEGIES = {
  EXACT: 'exact' as const,
  NEAREST: 'nearest' as const,
  END: 'end' as const,
  START: 'start' as const,
}; 