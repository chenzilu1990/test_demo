import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import type {
  Klass,
  LexicalCommand,
  LexicalEditor,
  TextNode,
} from 'lexical'
import {
  $getNodeByKey,
  $getSelection,
  $isDecoratorNode,
  $isNodeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical'
import type { EntityMatch } from '@lexical/text'
import {
  mergeRegister,
} from '@lexical/utils'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { registerLexicalTextEntity } from './utils'

export type UseSelectOrDeleteHanlder = (nodeKey: string, command?: LexicalCommand<undefined>) => [RefObject<HTMLDivElement | null>, boolean]
export const useSelectOrDelete: UseSelectOrDeleteHanlder = (nodeKey: string, command?: LexicalCommand<undefined>) => {
  const ref = useRef<HTMLDivElement>(null)
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)

  const handleDelete = useCallback(
    (event: KeyboardEvent) => {
      const selection = $getSelection()
      const nodes = selection?.getNodes()
      if (
        !isSelected
        && nodes?.length === 1
      )
        editor.dispatchCommand(command as LexicalCommand<unknown>, undefined)

      if (isSelected && $isNodeSelection(selection)) {
        event.preventDefault()
        const node = $getNodeByKey(nodeKey)
        if ($isDecoratorNode(node)) {
          if (command)
            editor.dispatchCommand(command as LexicalCommand<unknown>, undefined)

          node.remove()
          return true
        }
      }

      return false
    },
    [isSelected, nodeKey, command, editor],
  )

  const handleSelect = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    clearSelection()
    setSelected(true)
  }, [setSelected, clearSelection])

  useEffect(() => {
    const ele = ref.current

    if (ele)
      ele.addEventListener('click', handleSelect)

    return () => {
      if (ele)
        ele.removeEventListener('click', handleSelect)
    }
  }, [handleSelect])
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        handleDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        handleDelete,
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, clearSelection, handleDelete])

  return [ref, isSelected]
}

export type UseTriggerHandler = () => [RefObject<HTMLDivElement | null>, boolean, Dispatch<SetStateAction<boolean>>]
export const useTrigger: UseTriggerHandler = () => {
  const triggerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const handleOpen = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    setOpen(v => !v)
  }, [])

  useEffect(() => {
    const trigger = triggerRef.current
    if (trigger)
      trigger.addEventListener('click', handleOpen)

    return () => {
      if (trigger)
        trigger.removeEventListener('click', handleOpen)
    }
  }, [handleOpen])

  return [triggerRef, open, setOpen]
}

export function useLexicalTextEntity<T extends TextNode>(
  getMatch: (text: string) => null | EntityMatch,
  targetNode: Klass<T>,
  createNode: (textNode: TextNode) => T,
) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return mergeRegister(...registerLexicalTextEntity(editor, getMatch, targetNode, createNode))
  }, [createNode, editor, getMatch, targetNode])
}

export type MenuTextMatch = {
  leadOffset: number
  matchingString: string
  replaceableString: string
}
export type TriggerFn = (
  text: string,
  editor: LexicalEditor,
) => MenuTextMatch | null
export const PUNCTUATION = '\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%\'"~=<>_:;'
export function useBasicTypeaheadTriggerMatch(
  trigger: string,
  { minLength = 1, maxLength = 75 }: { minLength?: number; maxLength?: number },
): TriggerFn {
  return useCallback(
    (text: string) => {
      const validChars = `[${PUNCTUATION}\\s]`
      const TypeaheadTriggerRegex = new RegExp(
        '(.*)('
          + `[${trigger}]`
          + `((?:${validChars}){0,${maxLength}})`
          + ')$',
      )
      const match = TypeaheadTriggerRegex.exec(text)
      if (match !== null) {
        const maybeLeadingWhitespace = match[1]
        const matchingString = match[3]
        if (matchingString.length >= minLength) {
          return {
            leadOffset: match.index + maybeLeadingWhitespace.length,
            matchingString,
            replaceableString: match[2],
          }
        }
      }
      return null
    },
    [maxLength, minLength, trigger],
  )
}
