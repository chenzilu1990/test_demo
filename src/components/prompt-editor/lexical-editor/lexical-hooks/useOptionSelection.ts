/**
 * 选项选择钩子 (useOptionSelection)
 * 
 * 主要功能：
 * 1. 管理选项面板的显示/隐藏状态
 * 2. 处理方括号和已选择值的点击逻辑
 * 3. 执行节点替换操作 (BracketNode → SelectedValueNode)
 * 4. 智能光标管理，确保良好的用户体验
 * 
 * 状态管理：
 * - currentSelection: 当前选中的节点信息
 * - isShowingOptions: 选项面板是否显示
 * 
 * 光标策略（采用 Dify 风格）：
 * - 节点替换后使用多策略光标恢复
 * - 支持上下文感知的光标调整
 * - 多级错误处理，确保光标设置的健壮性
 * - 静默处理光标设置失败，不影响用户体验
 * 
 * 扩展性：
 * - 支持自定义光标位置策略
 * - 便于添加新的节点替换逻辑
 * - 可扩展选项选择后的回调处理
 */

import { useState, useCallback } from 'react';
import { LexicalEditor } from 'lexical';
import { BracketNode, $isBracketNode } from '../nodes/BracketNode';
import { SelectedValueNode, $createSelectedValueNode, $isSelectedValueNode } from '../nodes/SelectedValueNode';
import { BracketParameterOptions } from '../../types';
import { useCursorManager } from './useCursorManager';

interface CurrentSelection {
  /** 选项类型 */
  type: string;
  /** 可选项列表 */
  options: string[];
  /** 被选中的节点 */
  node: BracketNode | SelectedValueNode | null;
  /** 编辑器实例 */
  editor: LexicalEditor | null;
}

interface UseOptionSelectionOptions {
  /** 方括号选项配置 */
  bracketOptions: BracketParameterOptions;
}

/**
 * 选项选择钩子
 * @param options - 配置选项
 * @returns 选项选择相关的状态和处理函数
 */
export function useOptionSelection({ bracketOptions }: UseOptionSelectionOptions) {
  // 选项面板显示状态
  const [isShowingOptions, setIsShowingOptions] = useState(false);
  
  // 当前选中的节点信息
  const [currentSelection, setCurrentSelection] = useState<CurrentSelection | null>(null);

  // 使用 Dify 风格的光标管理器
  const cursorManager = useCursorManager();

  /**
   * 处理方括号节点点击
   * @param bracketType - 方括号类型
   * @param options - 可选项列表
   * @param node - 被点击的节点
   * @param editor - 编辑器实例
   */
  const handleBracketClick = useCallback((
    bracketType: string, 
    options: string[], 
    node: BracketNode, 
    editor: LexicalEditor
  ) => {
    setCurrentSelection({
      type: bracketType,
      options,
      node,
      editor
    });
    setIsShowingOptions(true);
  }, []);

  /**
   * 处理已选择值节点点击（重新选择）
   * @param node - 被点击的已选择值节点
   * @param editor - 编辑器实例
   */
  const handleSelectedValueClick = useCallback((
    node: SelectedValueNode, 
    editor: LexicalEditor
  ) => {
    const originalBracket = node.getOriginalBracket();
    const bracketContent = originalBracket.slice(1, -1); // 移除方括号
    
    // Fetch options from the main bracketOptions map
    const currentParamOptions = bracketOptions[bracketContent] || [];
    
    setCurrentSelection({
      type: node.getValueType(), // This is the parameter name (e.g., "国家")
      options: currentParamOptions, // Pass the found options or an empty array
      node,
      editor
    });
    setIsShowingOptions(true);
  }, [bracketOptions]);

  /**
   * 处理选项选择
   * 使用 Dify 风格的光标管理策略
   * @param option - 用户选择的选项
   */
  const handleOptionSelect = useCallback((option: string) => {
    if (!currentSelection?.node || !currentSelection?.editor) return;

    const { node, editor } = currentSelection;
    
    editor.update(() => {
      // 🎯 步骤1: 保存当前光标状态（如果光标管理器可用）
      const savedCursorState = cursorManager.isAvailable ? cursorManager.saveCursor() : null;
      
      let newNode: SelectedValueNode;
      
      try {
        if ($isBracketNode(node)) {
          // 场景1: 方括号节点 → 已选择值节点
          newNode = $createSelectedValueNode(
            option,
            `[${node.getBracketType()}]`,
            node.getBracketType()
          );
          node.replace(newNode);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 方括号节点替换为已选择值:', option);
          }
        } else if ($isSelectedValueNode(node)) {
          // 场景2: 更新已选择值节点
          newNode = $createSelectedValueNode(
            option,
            node.getOriginalBracket(),
            node.getValueType()
          );
          node.replace(newNode);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 更新已选择值:', option);
          }
        } else {
          return; // 未知节点类型，不处理
        }

        // 🎯 步骤2: 使用 Dify 风格的智能光标管理（如果可用）
        if (cursorManager.isAvailable) {
          const success = cursorManager.setCursorToNode(newNode, 'end');
          
          if (!success && savedCursorState) {
            // 如果直接设置失败，尝试使用保存的状态
            const restoreSuccess = cursorManager.restoreCursor(savedCursorState, 'nearest');
            
            if (!restoreSuccess) {
              // 最后回退：使用上下文感知调整
              cursorManager.adjustCursor({
                type: 'node-replace',
                sourceNode: node,
                targetNode: newNode,
                data: { 
                  operationType: 'option-selection',
                  selectedOption: option 
                }
              });
            }
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ 选项选择完成，光标已调整');
          }
        } else {
          // 如果光标管理器不可用，使用传统的光标设置方法
          try {
            newNode.selectEnd();
          } catch (fallbackError) {
            // 静默处理光标设置失败
          }
        }
      } catch (error) {
        // 节点替换失败时的错误处理
        if (process.env.NODE_ENV === 'development') {
          console.error('🚨 节点替换失败:', error);
        }
        
        // 尝试恢复原始光标位置
        if (cursorManager.isAvailable && savedCursorState) {
          cursorManager.restoreCursor(savedCursorState, 'exact');
        }
      }
    });

    // 关闭选项面板
    closeOptionsPanel();
  }, [currentSelection, cursorManager]);

  /**
   * 关闭选项面板
   */
  const closeOptionsPanel = useCallback(() => {
    setIsShowingOptions(false);
    setCurrentSelection(null);
  }, []);

  return {
    // 状态
    isShowingOptions,
    currentSelection,
    
    // 处理函数
    handleBracketClick,
    handleSelectedValueClick,
    handleOptionSelect,
    closeOptionsPanel,
  };
}

/**
 * 光标位置策略枚举（保持向后兼容）
 */
export const CURSOR_STRATEGIES = {
  /** 节点末尾 */
  END: 'end',
  /** 节点开始 */
  START: 'start',
  /** 选中整个节点 */
  SELECT_ALL: 'select-all',
} as const;

export type CursorStrategy = typeof CURSOR_STRATEGIES[keyof typeof CURSOR_STRATEGIES]; 