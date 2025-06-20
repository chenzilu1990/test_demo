import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { EntityMatch } from '@lexical/text'
import { registerLexicalTextEntity } from '../../utils'
import { $createMentionNode, MentionNode } from './MentionNode'
import type { TextNode } from 'lexical'

// Mention 正则表达式：匹配 @后跟字母数字下划线中文等（至少一个字符）
const MENTION_REGEX = /@([\w\u4e00-\u9fa5]+)/

export default function MentionPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // 创建匹配函数
    const getMentionMatch = (text: string): EntityMatch | null => {
      const match = MENTION_REGEX.exec(text)
      if (match !== null) {
        // 返回匹配信息
        const mentionLength = match[0].length
        const startOffset = match.index
        const endOffset = startOffset + mentionLength
        return {
          end: endOffset,
          start: startOffset,
        }
      }
      return null
    }

    // 创建节点函数
    const createMentionNode = (textNode: TextNode): MentionNode => {
      const text = textNode.getTextContent()
      const match = MENTION_REGEX.exec(text)
      if (match) {
        const mentionName = match[1]
        // 这里先创建一个临时的 mention 数据
        // 实际使用时应该从用户数据中查找
        return $createMentionNode({
          id: `temp-${mentionName}`,
          name: mentionName,
          type: 'user',
        })
      }
      // fallback - 这种情况不应该发生
      return $createMentionNode({
        id: 'unknown',
        name: text.replace('@', ''),
        type: 'user',
      })
    }

    // 注册文本实体
    const removeTransform = registerLexicalTextEntity(
      editor,
      getMentionMatch,
      MentionNode,
      createMentionNode,
    )

    return () => {
      removeTransform.forEach(remove => remove())
    }
  }, [editor])

  return null
}