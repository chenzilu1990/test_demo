import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { EntityMatch } from '@lexical/text'
import { registerLexicalTextEntity } from '../../utils'
import { $createRegexBlockNode, RegexBlockNode, type RegexBlockType } from './RegexBlockNode'
import type { TextNode } from 'lexical'
import { $createTextNode } from 'lexical'

// 正则表达式：匹配不同类型的块
const REGEX_PATTERNS = {
  square: /\[([^\[\]]+)\]/g,        // [content]
  curly: /\{([^{}]+)\}/g,          // {content} (单层)
  doubleCurly: /\{\{([^{}]+)\}\}/g, // {{content}}
}

// 组合正则表达式，按优先级排序（双花括号优先级最高）
const COMBINED_REGEX = /\{\{([^{}]+)\}\}|\{([^{}]+)\}|\[([^\[\]]+)\]/g

export default function RegexBlockPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // 创建匹配函数
    const getRegexBlockMatch = (text: string): EntityMatch | null => {
      // 重置正则表达式的 lastIndex
      COMBINED_REGEX.lastIndex = 0
      const match = COMBINED_REGEX.exec(text)
      
      if (match !== null) {
        const matchLength = match[0].length
        const startOffset = match.index
        const endOffset = startOffset + matchLength
        return {
          end: endOffset,
          start: startOffset,
        }
      }
      return null
    }

    // 创建节点函数
    const createRegexBlockNode = (textNode: TextNode): RegexBlockNode => {
      const text = textNode.getTextContent()
      COMBINED_REGEX.lastIndex = 0
      const match = COMBINED_REGEX.exec(text)
      
      if (match) {
        let content: string
        let type: RegexBlockType
        
        if (match[1]) {
          // {{content}} - 双花括号
          content = match[1]
          type = 'double-curly'
        } else if (match[2]) {
          // {content} - 单花括号
          content = match[2]
          type = 'curly'
        } else if (match[3]) {
          // [content] - 方括号
          content = match[3]
          type = 'square'
        } else {
          // 后备方案
          content = text.replace(/[\[\]{}]/g, '')
          type = 'square'
        }
        
        // 创建临时的 regex block 数据
        return $createRegexBlockNode({
          id: `temp-${content}-${Date.now()}`,
          content: content,
          type: type,
          description: `自动识别的 ${type} 块`,
        })
      }
      
      // fallback - 这种情况不应该发生
      return $createRegexBlockNode({
        id: 'unknown',
        content: text,
        type: 'square',
      })
    }

    // 注册文本实体
    const removeTransform = registerLexicalTextEntity(
      editor,
      getRegexBlockMatch,
      RegexBlockNode,
      createRegexBlockNode,
    )

    return () => {
      removeTransform.forEach(remove => remove())
    }
  }, [editor])

  return null
}