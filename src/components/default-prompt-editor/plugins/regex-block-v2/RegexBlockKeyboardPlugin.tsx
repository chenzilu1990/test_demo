import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical'
import { $isRegexBlockNode } from './RegexBlockNode'

export default function RegexBlockKeyboardPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // 处理退格键
    const handleBackspace = (): boolean => {
      let handled = false
      editor.update(() => {
        const selection = $getSelection()
        
        if ($isRangeSelection(selection)) {
          const anchor = selection.anchor
          const anchorNode = anchor.getNode()
          
          // 如果光标在 regex block 节点后面，且偏移量为 0
          if (anchor.offset === 0) {
            const previousSibling = anchorNode.getPreviousSibling()
            
            if (previousSibling && $isRegexBlockNode(previousSibling)) {
              // 删除前面的 regex block 节点
              previousSibling.remove()
              handled = true
            }
          }
        } else if ($isNodeSelection(selection)) {
          // 如果选中了节点，直接删除
          const nodes = selection.getNodes()
          nodes.forEach(node => {
            if ($isRegexBlockNode(node)) {
              node.remove()
              handled = true
            }
          })
        }
      })
      return handled
    }

    // 处理删除键
    const handleDelete = (): boolean => {
      let handled = false
      editor.update(() => {
        const selection = $getSelection()
        
        if ($isRangeSelection(selection)) {
          const anchor = selection.anchor
          const anchorNode = anchor.getNode()
          
          // 如果光标在 regex block 节点前面
          const nextSibling = anchorNode.getNextSibling()
          
          if (nextSibling && $isRegexBlockNode(nextSibling) && 
              anchor.offset === anchorNode.getTextContentSize()) {
            // 删除后面的 regex block 节点
            nextSibling.remove()
            handled = true
          }
        }
      })
      return handled
    }

    // 注册命令监听器
    const removeBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      handleBackspace,
      COMMAND_PRIORITY_HIGH
    )
    
    const removeDelete = editor.registerCommand(
      KEY_DELETE_COMMAND,
      handleDelete,
      COMMAND_PRIORITY_HIGH
    )

    return () => {
      removeBackspace()
      removeDelete()
    }
  }, [editor])

  return null
}