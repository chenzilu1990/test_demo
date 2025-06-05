/**
 * 模板解析插件 (TemplateParserPlugin)
 * 
 * 主要功能：
 * 1. 解析提示词模板中的方括号参数 (如 [国家]、[城市] 等)
 * 2. 将方括号转换为可交互的BracketNode节点
 * 3. 专注于外部模板导入时的初始解析
 * 4. 与RealTimeParserPlugin协调工作，避免冲突
 * 
 * 使用场景：
 * - 用户选择新的提示词模板时，自动解析并渲染参数
 * - 外部传入新的模板内容时进行一次性解析
 * 
 * 性能优化：
 * - 使用useRef避免不必要的状态更新
 * - 智能内容比较，只在真正需要时重新解析
 * - 开发/生产环境分离的日志输出
 * - 避免与实时解析插件的重复处理
 */

import { useEffect, useRef } from 'react';
import { $getRoot, $createTextNode, $createParagraphNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { BracketNode, $createBracketNode } from '../nodes/BracketNode';

interface TemplateParserPluginProps {
  /** 要解析的模板字符串 */
  initialValue: string;
}

/**
 * 模板解析插件组件
 * 负责将包含方括号的模板字符串解析为Lexical节点树
 * 专注于外部模板导入，与实时解析插件协调工作
 */
export function TemplateParserPlugin({ 
  initialValue
}: TemplateParserPluginProps) {
  const [editor] = useLexicalComposerContext();
  const lastParsedValueRef = useRef<string>('');
  const isInitializedRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!initialValue || isProcessingRef.current) return;
    
    // 性能优化：如果值没有变化，跳过解析
    if (initialValue === lastParsedValueRef.current) {
      return;
    }

    // 智能检查：区分外部更新 vs 用户输入
    let shouldUpdate = true;
    
    // 如果不是首次初始化，则进行智能检查
    if (isInitializedRef.current && lastParsedValueRef.current !== '') {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const currentContent = root.getTextContent();
        
        // 如果编辑器内容已经和传入值相同，说明可能是用户输入导致的
        // 但如果传入值明显不同（例如是全新的模板），则应该更新
        const contentSimilarity = calculateSimilarity(currentContent, initialValue);
        if (contentSimilarity > 0.8) {
          shouldUpdate = false;
        }
      });
    }
    
    if (!shouldUpdate) {
      lastParsedValueRef.current = initialValue;
      return;
    }

    // 开发环境日志
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 初始模板解析:', initialValue.substring(0, 50) + (initialValue.length > 50 ? '...' : ''));
    }
    
    lastParsedValueRef.current = initialValue;
    isProcessingRef.current = true;

    // 执行模板解析
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      // 创建段落容器（Lexical要求根节点只能包含ElementNode）
      const paragraph = $createParagraphNode();
      
      // 解析模板中的方括号参数
      const parsedNodes = parseTemplateString(initialValue);
      
      // 将解析后的节点添加到段落中
      parsedNodes.forEach(node => paragraph.append(node));
      
      // 将段落添加到根节点
      root.append(paragraph);

      // 标记已初始化
      isInitializedRef.current = true;
      isProcessingRef.current = false;

      if (process.env.NODE_ENV === 'development') {
        const bracketCount = parsedNodes.filter(node => node instanceof BracketNode).length;
        console.log(`✅ 初始模板解析完成，创建了 ${bracketCount} 个方括号节点`);
      }
    });
  }, [editor, initialValue]);

  return null;
}

/**
 * 解析模板字符串，将其转换为Lexical节点数组
 * @param template - 包含方括号的模板字符串
 * @returns Lexical节点数组
 */
function parseTemplateString(
  template: string
) {
  const nodes = [];
  const regex = /\[(.*?)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(template)) !== null) {
    // 添加方括号前的普通文本
    if (match.index > lastIndex) {
      const textBefore = template.substring(lastIndex, match.index);
      if (textBefore) {
        nodes.push($createTextNode(textBefore));
      }
    }

    // 处理方括号内容
    const bracketContent = match[1];
    const bracketNode = $createBracketNode(
      `[${bracketContent}]`,
      bracketContent
    );
    nodes.push(bracketNode);

    lastIndex = match.index + match[0].length;
  }

  // 添加剩余的文本
  if (lastIndex < template.length) {
    const textAfter = template.substring(lastIndex);
    if (textAfter) {
      nodes.push($createTextNode(textAfter));
    }
  }

  return nodes;
}

/**
 * 计算两个字符串的相似度
 * @param str1 - 第一个字符串
 * @param str2 - 第二个字符串
 * @returns 相似度值 (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  // 简单的长度和字符相似度计算
  const lengthSimilarity = 1 - Math.abs(str1.length - str2.length) / Math.max(str1.length, str2.length);
  const commonChars = str1.split('').filter(char => str2.includes(char)).length;
  const charSimilarity = commonChars / Math.max(str1.length, str2.length);
  
  return (lengthSimilarity + charSimilarity) / 2;
} 