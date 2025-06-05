/**
 * 点击处理插件 (ClickHandlerPlugin)
 * 
 * 主要功能：
 * 1. 监听编辑器内的点击事件
 * 2. 识别并处理自定义节点的点击 (BracketNode 和 SelectedValueNode)
 * 3. 触发相应的回调函数显示选项面板
 * 4. 管理节点选中状态和光标位置
 * 
 * 交互流程：
 * 1. 用户点击蓝色方括号 → 显示选项列表
 * 2. 用户点击绿色已选值 → 重新显示选项列表
 * 3. 点击其他区域 → 正常的文本编辑行为
 * 
 * 性能优化：
 * - 使用事件委托，只在编辑器根元素添加一个监听器
 * - 事件捕获阶段处理，确保自定义节点优先响应
 * - 智能事件过滤，只处理相关的点击事件
 */

import { useEffect } from 'react';
import { LexicalEditor, $getNearestNodeFromDOMNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { BracketNode, $isBracketNode } from '../nodes/BracketNode';
import { SelectedValueNode, $isSelectedValueNode } from '../nodes/SelectedValueNode';
import { BracketParameterOptions } from '../../types';

interface ClickHandlerPluginProps {
  /** 方括号选项配置 */
  bracketOptions: BracketParameterOptions;
  /** 方括号点击回调 */
  onBracketClick: (bracketType: string, options: string[], node: BracketNode, editor: LexicalEditor) => void;
  /** 已选择值点击回调 */
  onSelectedValueClick: (node: SelectedValueNode, editor: LexicalEditor) => void;
}

/**
 * 点击处理插件组件
 * 负责处理编辑器内自定义节点的点击交互
 */
export function ClickHandlerPlugin({ 
  bracketOptions, 
  onBracketClick, 
  onSelectedValueClick 
}: ClickHandlerPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    /**
     * 处理编辑器内的点击事件
     * @param event - 鼠标点击事件
     */
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // 快速检查：是否点击了自定义节点
      const isBracketNode = target.classList.contains('bracket-node');
      const isSelectedValueNode = target.classList.contains('selected-value-node');
      
      if (!isBracketNode && !isSelectedValueNode) {
        return; // 不是自定义节点，让正常的点击处理继续
      }

      // 阻止默认行为，防止影响光标位置
      event.preventDefault();
      event.stopPropagation();
      
      // 在编辑器上下文中处理点击
      editor.update(() => {
        try {
          // 从DOM节点获取对应的Lexical节点
          const lexicalNode = $getNearestNodeFromDOMNode(target);
          
          if (isBracketNode && $isBracketNode(lexicalNode)) {
            handleBracketNodeClick(target, lexicalNode, bracketOptions, onBracketClick, editor);
          } else if (isSelectedValueNode && $isSelectedValueNode(lexicalNode)) {
            handleSelectedValueNodeClick(lexicalNode, bracketOptions, onSelectedValueClick, editor);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('🚨 点击处理错误:', error);
          }
        }
      });
    };

    // 在编辑器根元素上添加点击监听器
    const editorElement = editor.getRootElement();
    if (editorElement) {
      // 使用捕获阶段确保自定义节点优先响应
      editorElement.addEventListener('click', handleClick, true);
      
      return () => {
        editorElement.removeEventListener('click', handleClick, true);
      };
    }
  }, [editor, bracketOptions, onBracketClick, onSelectedValueClick]);

  return null;
}

/**
 * 处理方括号节点点击
 * @param domElement - 被点击的DOM元素
 * @param lexicalNode - 对应的Lexical节点
 * @param bracketOptions - 方括号选项配置
 * @param onBracketClick - 点击回调函数
 * @param editor - 编辑器实例
 */
function handleBracketNodeClick(
  domElement: HTMLElement,
  lexicalNode: BracketNode,
  bracketOptions: BracketParameterOptions,
  onBracketClick: (bracketType: string, options: string[], node: BracketNode, editor: LexicalEditor) => void,
  editor: LexicalEditor
) {
  const bracketType = lexicalNode.getBracketType();
  
  const currentParamOptions = bracketOptions[bracketType] || [];
  
  lexicalNode.select();
  
  onBracketClick(bracketType, currentParamOptions, lexicalNode, editor);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 方括号点击:', bracketType, '提供选项:', currentParamOptions);
  }
}

/**
 * 处理已选择值节点点击
 * @param lexicalNode - 被点击的已选择值节点
 * @param bracketOptions - 方括号选项配置
 * @param onSelectedValueClick - 点击回调函数
 * @param editor - 编辑器实例
 */
function handleSelectedValueNodeClick(
  lexicalNode: SelectedValueNode,
  bracketOptions: BracketParameterOptions,
  onSelectedValueClick: (node: SelectedValueNode, editor: LexicalEditor) => void,
  editor: LexicalEditor
) {
  lexicalNode.select();
  
  onSelectedValueClick(lexicalNode, editor);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 已选值点击:', lexicalNode.getValueType());
  }
} 