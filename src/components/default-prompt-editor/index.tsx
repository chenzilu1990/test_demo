'use client'

import type { FC } from 'react'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import type {
  EditorState,
  LexicalEditor,
} from 'lexical'
import {
  $getRoot,
  TextNode,
  $insertNodes,
  $getSelection,
  CLEAR_EDITOR_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
} from 'lexical'
import { CodeNode } from '@lexical/code'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { textToEditorState } from './utils'
import type { 
  EditorContent, 
  EditorEventHandlers, 
  EditorConfiguration,
  EditorRef,
  EditorTheme
} from './editor.types'

export interface PromptEditorProps extends EditorEventHandlers {
  className?: string
  placeholder?: string
  placeholderClassName?: string
  style?: React.CSSProperties
  value?: string
  editable?: boolean
  editorConfig?: EditorConfiguration
  
  // 子组件（用于插件）
  children?: React.ReactNode
}
import './index.css'

// 导出类型以供外部使用

// 内部编辑器组件，用于访问 editor 实例
const InnerEditor = forwardRef<EditorRef, PromptEditorProps>((
  props,
  ref
) => {
  const [editor] = useLexicalComposerContext()
  const { onBlur, onFocus, children } = props

  useImperativeHandle(ref, () => ({
    editor,
    focus: () => editor.focus(),
    blur: () => editor.blur(),
    clear: () => editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined),
    getContent: () => {
      const state = editor.getEditorState()
      return {
        text: state.read(() => $getRoot().getTextContent()),
        json: state.toJSON()
      }
    },
    setContent: (content) => {
      if (typeof content === 'string') {
        const state = textToEditorState(content)
        editor.setEditorState(editor.parseEditorState(state))
      } else {
        editor.setEditorState(editor.parseEditorState(content))
      }
    },
    insertText: (text) => {
      editor.update(() => {
        const selection = $getSelection()
        if (selection) {
          selection.insertText(text)
        }
      })
    },
    insertNode: (node) => {
      editor.update(() => {
        $insertNodes([node])
      })
    },
    undo: () => editor.dispatchCommand(UNDO_COMMAND, undefined),
    redo: () => editor.dispatchCommand(REDO_COMMAND, undefined),
    canUndo: () => {
      // Lexical doesn't provide a direct way to check undo/redo status
      // This is a limitation of the current Lexical API
      return false
    },
    canRedo: () => {
      // Lexical doesn't provide a direct way to check undo/redo status
      // This is a limitation of the current Lexical API
      return false
    },
  }), [editor])

  return <>{children}</>
})

InnerEditor.displayName = 'InnerEditor'

const PromptEditor = forwardRef<EditorRef, PromptEditorProps>((props, ref) => {
  const {
    className,
    placeholder,
    placeholderClassName,
    style,
    value,
    editable = true,
    children,
    editorConfig,
    onChange,
    onBlur,
    onFocus,
    onError,
    onKeyDown,
    onPaste
  } = props

  const defaultNodes = [
    CodeNode,
    ...(editorConfig?.nodes || [])
  ]
  
  const theme: EditorTheme = {
    ...editorConfig?.theme,
    placeholder: placeholderClassName,
  }

  const initialConfig = {
    namespace: 'prompt-editor',
    nodes: defaultNodes,
    editorState: textToEditorState(value || ''),
    theme,
    editable: editorConfig?.editable ?? editable ?? true,
    onError: (error: Error, editor: LexicalEditor) => {
      if (onError) {
        onError(error, editor)
      } else {
        console.error('PromptEditor error:', error)
      }
    },
  }

  const handleEditorChange = (editorState: EditorState, editor: LexicalEditor) => {
    if (!onChange) return

    const content: EditorContent = {
      text: editorState.read(() => {
        return $getRoot().getChildren().map(p => p.getTextContent()).join('\n')
      }),
      json: editorState.toJSON()
    }

    onChange(content, editorState)
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className='workflow-node-variable-text-input-field'>
        <RichTextPlugin
          contentEditable={
            <ContentEditable 
              className={`${className} workflow-node-variable-text-input-field__rich-text`} 
              style={style || {}} 
              onBlur={(e) => onBlur?.(e.nativeEvent, (e.target as any).__lexicalEditor)}
              onFocus={(e) => onFocus?.(e.nativeEvent, (e.target as any).__lexicalEditor)}
            />
          }
          placeholder={placeholder ? <div className={placeholderClassName}>{placeholder}</div> : null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={handleEditorChange} />
        <InnerEditor ref={ref} {...props}>
          {children}
        </InnerEditor>
      </div>
    </LexicalComposer>
  )
})

PromptEditor.displayName = 'PromptEditor'

export default PromptEditor
export type { EditorRef, EditorContent, EditorConfiguration } from './editor.types'