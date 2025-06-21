import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { EntityMatch } from '@lexical/text'
import { registerLexicalTextEntity } from '../../utils'
import { $createPromptTemplateNode, PromptTemplateNode, type PromptTemplateType } from './PromptTemplateNode'
import type { TextNode } from 'lexical'

// 正则表达式：匹配不同类型的参数模板
const TEMPLATE_PATTERNS = {
  square: /\[([^\[\]]+)\]/g,        // [参数名]
  curly: /\{([^{}]+)\}/g,          // {参数名} (单层)
  doubleCurly: /\{\{([^{}]+)\}\}/g, // {{参数名}}
}

// 组合正则表达式，按优先级排序（双花括号优先级最高）
const COMBINED_TEMPLATE_REGEX = /\{\{([^{}]+)\}\}|\{([^{}]+)\}|\[([^\[\]]+)\]/g

export interface PromptTemplatePluginProps {
  parameterOptions?: Record<string, string[]>
}

export default function PromptTemplatePlugin({ 
  parameterOptions = {} 
}: PromptTemplatePluginProps): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // 创建匹配函数
    const getTemplateMatch = (text: string): EntityMatch | null => {
      // 重置正则表达式的 lastIndex
      COMBINED_TEMPLATE_REGEX.lastIndex = 0
      const match = COMBINED_TEMPLATE_REGEX.exec(text)
      
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
    const createPromptTemplateNode = (textNode: TextNode): PromptTemplateNode => {
      const text = textNode.getTextContent()
      COMBINED_TEMPLATE_REGEX.lastIndex = 0
      const match = COMBINED_TEMPLATE_REGEX.exec(text)
      
      if (match) {
        let parameterName: string
        let type: PromptTemplateType
        
        if (match[1]) {
          // {{参数名}} - 双花括号
          parameterName = match[1]
          type = 'double-curly'
        } else if (match[2]) {
          // {参数名} - 单花括号
          parameterName = match[2]
          type = 'curly'
        } else if (match[3]) {
          // [参数名] - 方括号
          parameterName = match[3]
          type = 'square'
        } else {
          // 后备方案
          parameterName = text.replace(/[\[\]{}]/g, '')
          type = 'square'
        }
        
        // 获取该参数的选项（如果有）
        const options = parameterOptions[parameterName] || []
        
        // 创建 prompt template 节点
        return $createPromptTemplateNode({
          parameterName: parameterName,
          type: type,
          options: options,
          isSelected: false,
        })
      }
      
      // fallback - 这种情况不应该发生
      return $createPromptTemplateNode({
        parameterName: text,
        type: 'square',
        options: [],
        isSelected: false,
      })
    }

    // 注册文本实体
    const removeTransform = registerLexicalTextEntity(
      editor,
      getTemplateMatch,
      PromptTemplateNode,
      createPromptTemplateNode,
    )

    return () => {
      removeTransform.forEach(remove => remove())
    }
  }, [editor, parameterOptions])

  return null
}