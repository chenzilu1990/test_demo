/**
 * 模板解析插件 (TemplateParserPlugin)
 * 
 * 主要功能：
 * 1. 解析提示词模板中的方括号参数 (如 [国家]、[城市] 等)
 * 2. 将方括号转换为可交互的BracketNode节点
 * 3. 智能识别外部模板更新 vs 用户输入，避免重复解析
 * 4. 支持动态方括号选项配置
 * 
 * 使用场景：
 * - 用户选择新的提示词模板时，自动解析并渲染参数
 * - 防止用户输入时重复解析导致的光标跳动问题
 * 
 * 性能优化：
 * - 使用useRef避免不必要的状态更新
 * - 智能内容比较，只在真正需要时重新解析
 * - 开发/生产环境分离的日志输出
 */

import { useEffect, useRef } from 'react';
import { $getRoot, $createTextNode, $createParagraphNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { BracketNode, $createBracketNode } from '../nodes/BracketNode';
import { BracketParameterOptions } from "../../types";


interface TemplateParserPluginProps {
  /** 要解析的模板字符串 */
  initialValue: string;
  /** 方括号选项配置，key为方括号内容，value为选项配置 */
  bracketOptions: BracketParameterOptions;
}

/**
 * 模板解析插件组件
 * 负责将包含方括号的模板字符串解析为Lexical节点树
 */
export function TemplateParserPlugin({ 
  initialValue, 
  bracketOptions
}: TemplateParserPluginProps) {
  const [editor] = useLexicalComposerContext();
  const lastParsedValueRef = useRef<string>('');
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!initialValue) return;

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
        // 如果编辑器内容已经和传入值相同，说明是用户输入导致的
        if (currentContent === initialValue) {
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
      console.log('🔄 模板解析:', initialValue);
      console.log('📝 可用的方括号选项:', Object.keys(bracketOptions));
    }
    
    lastParsedValueRef.current = initialValue;

    // 执行模板解析
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      // 创建段落容器（Lexical要求根节点只能包含ElementNode）
      const paragraph = $createParagraphNode();
      
      // 解析模板中的方括号参数
      const parsedNodes = parseTemplateString(initialValue, bracketOptions);
      
      // 将解析后的节点添加到段落中
      parsedNodes.forEach(node => paragraph.append(node));
      
      // 将段落添加到根节点
      root.append(paragraph);

      // 标记已初始化
      isInitializedRef.current = true;

      if (process.env.NODE_ENV === 'development') {
        const bracketCount = parsedNodes.filter(node => node instanceof BracketNode).length;
        console.log(`✅ 模板解析完成，创建了 ${bracketCount} 个方括号节点`);
      }
    });
  }, [editor, initialValue, bracketOptions]);

  return null;
}

/**
 * 解析模板字符串，将其转换为Lexical节点数组
 * @param template - 包含方括号的模板字符串
 * @param bracketOptions - 方括号选项配置
 * @returns Lexical节点数组
 */
function parseTemplateString(
  template: string, 
  bracketOptions: BracketParameterOptions
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
    if (bracketOptions[bracketContent]) {
      // 创建可交互的方括号节点
      const bracketNode = $createBracketNode(
        `[${bracketContent}]`,
        bracketContent,
        bracketOptions[bracketContent]
      );
      nodes.push(bracketNode);
    } else {
      // 未识别的方括号，作为普通文本处理
      nodes.push($createTextNode(match[0]));
    }

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