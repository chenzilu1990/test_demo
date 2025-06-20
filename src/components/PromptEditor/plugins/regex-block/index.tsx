import { useCallback, useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { EntityMatch } from '@lexical/text'
import { registerLexicalTextEntity } from '../../utils'
import { CustomTextNode } from '../custom-text/node'
import { $createRegexNode, RegexNode, $isRegexNode } from './node'

const REGEX_PATTERN = /\[(.*?)\]/g;

export default function RegexPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  const createRegexMatch = useCallback((text: string): EntityMatch | null => {
    REGEX_PATTERN.lastIndex = 0
    const match = REGEX_PATTERN.exec(text)
    
    if (match !== null) {
      const regexText = match[1]
      const flags = match[2] || ''
      
      // 验证正则表达式是否有效
      try {
        new RegExp(regexText, flags)
        return {
          start: match.index,
          end: match.index + match[0].length,
        }
      } catch {
        // 无效的正则表达式仍然创建节点用于显示错误
        return {
          start: match.index,
          end: match.index + match[0].length,
        }
      }
    }

    return null
  }, [])

  const createRegexNode = useCallback((textNode: CustomTextNode): RegexNode => {
    const text = textNode.getTextContent()
    REGEX_PATTERN.lastIndex = 0
    const match = REGEX_PATTERN.exec(text)
    
    if (match) {
      const fullMatch = match[0]
      const regexText = match[1]
      const flags = match[2] || ''
      
      // 验证正则表达式是否有效
      let isValid = true
      try {
        new RegExp(regexText, flags)
      } catch {
        isValid = false
      }
      
      return $createRegexNode(fullMatch, regexText + (flags ? `:${flags}` : ''), isValid)
    }
    
    return $createRegexNode(text, text, false)
  }, [])

  useEffect(() => {
    if (!editor.hasNodes([RegexNode])) {
      throw new Error('RegexPlugin: RegexNode not registered on editor')
    }

    return registerLexicalTextEntity(
      editor,
      createRegexMatch,
      RegexNode,
      createRegexNode,
    )[0]
  }, [createRegexMatch, createRegexNode, editor])

  return null
}

export { RegexNode, $createRegexNode, $isRegexNode } 