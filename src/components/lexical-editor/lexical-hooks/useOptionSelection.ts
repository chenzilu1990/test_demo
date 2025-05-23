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
 * 光标策略：
 * - 节点替换后自动将光标置于新节点末尾
 * - 支持多级错误处理，确保光标设置的健壮性
 * - 静默处理光标设置失败，不影响用户体验
 * 
 * 扩展性：
 * - 支持自定义光标位置策略
 * - 便于添加新的节点替换逻辑
 * - 可扩展选项选择后的回调处理
 */

import { useState, useCallback } from 'react';
import { LexicalEditor, $setSelection, $createRangeSelection } from 'lexical';
import { BracketNode, $isBracketNode } from '../../../nodes/BracketNode';
import { SelectedValueNode, $createSelectedValueNode, $isSelectedValueNode } from '../../../nodes/SelectedValueNode';
import { BracketOption } from '../../types';

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
  bracketOptions: Record<string, BracketOption>;
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
    
    if (bracketOptions[bracketContent]) {
      setCurrentSelection({
        type: node.getValueType(),
        options: bracketOptions[bracketContent].options,
        node,
        editor
      });
      setIsShowingOptions(true);
    }
  }, [bracketOptions]);

  /**
   * 处理选项选择
   * @param option - 用户选择的选项
   */
  const handleOptionSelect = useCallback((option: string) => {
    if (!currentSelection?.node || !currentSelection?.editor) return;

    const { node, editor } = currentSelection;
    
    editor.update(() => {
      let newNode: SelectedValueNode;
      
      if ($isBracketNode(node)) {
        // 场景1: 方括号节点 → 已选择值节点
        newNode = $createSelectedValueNode(
          option,
          `[${node.getBracketType()}]`,
          node.getBracketType()
        );
        node.replace(newNode);
      } else if ($isSelectedValueNode(node)) {
        // 场景2: 更新已选择值节点
        newNode = $createSelectedValueNode(
          option,
          node.getOriginalBracket(),
          node.getValueType()
        );
        node.replace(newNode);
      } else {
        return; // 未知节点类型，不处理
      }

      // 智能光标管理：将光标设置到新节点末尾
      setCursorToNodeEnd(newNode);
    });

    // 关闭选项面板
    closeOptionsPanel();
  }, [currentSelection]);

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
 * 将光标设置到节点末尾
 * @param node - 目标节点
 */
function setCursorToNodeEnd(node: SelectedValueNode) {
  try {
    // 主要策略：使用RangeSelection精确设置光标位置
    const selection = $createRangeSelection();
    selection.anchor.set(node.getKey(), node.getTextContentSize(), 'text');
    selection.focus.set(node.getKey(), node.getTextContentSize(), 'text');
    $setSelection(selection);
  } catch (error) {
    // 备用策略：使用节点自带的selectEnd方法
    try {
      node.selectEnd();
    } catch (fallbackError) {
      // 最终策略：在开发环境记录错误，生产环境静默处理
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ 光标设置失败:', error);
      }
    }
  }
}

/**
 * 光标位置策略枚举
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