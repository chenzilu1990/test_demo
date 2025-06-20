import type { 
  EditorState, 
  LexicalEditor, 
  LexicalNode,
  NodeKey,
  SerializedEditorState,
  SerializedLexicalNode
} from 'lexical'
import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import type { EditorConfig } from 'lexical'
import type { ReactNode } from 'react'

// 编辑器内容格式
export interface EditorContent {
  text: string
  html?: string
  json?: SerializedEditorState
  nodes?: SerializedLexicalNode[]
}

// 编辑器事件处理器
export interface EditorEventHandlers {
  onChange?: (content: EditorContent, editorState: EditorState) => void
  onBlur?: (event: FocusEvent, editor: LexicalEditor) => void
  onFocus?: (event: FocusEvent, editor: LexicalEditor) => void
  onKeyDown?: (event: KeyboardEvent, editor: LexicalEditor) => boolean | void
  onPaste?: (event: ClipboardEvent, editor: LexicalEditor) => boolean | void
  onError?: (error: Error, editor: LexicalEditor) => void
}

// 插件配置接口
export interface PluginConfig {
  name: string
  priority?: number
  component?: ReactNode
  nodes?: Array<typeof LexicalNode>
  init?: (editor: LexicalEditor) => void | (() => void)
}

// 编辑器配置
export interface EditorConfiguration {
  nodes?: Array<any> // Lexical nodes have complex type constraints
  plugins?: PluginConfig[]
  theme?: EditorTheme
  editable?: boolean
  autoFocus?: boolean
}

// 编辑器主题配置
export interface EditorTheme {
  root?: string
  paragraph?: string
  text?: {
    bold?: string
    italic?: string
    underline?: string
    strikethrough?: string
    code?: string
  }
  placeholder?: string
  [key: string]: any
}

// 编辑器实例引用
export interface EditorRef {
  editor: LexicalEditor | null
  focus: () => void
  blur: () => void
  clear: () => void
  getContent: () => EditorContent
  setContent: (content: string | SerializedEditorState) => void
  insertText: (text: string) => void
  insertNode: (node: LexicalNode) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

// 工具栏配置
export interface ToolbarConfig {
  show?: boolean
  items?: ToolbarItem[]
  position?: 'top' | 'bottom' | 'floating'
}

export interface ToolbarItem {
  type: 'button' | 'separator' | 'custom'
  name?: string
  icon?: ReactNode
  title?: string
  action?: (editor: LexicalEditor) => void
  isActive?: (editor: LexicalEditor) => boolean
  isDisabled?: (editor: LexicalEditor) => boolean
  component?: ReactNode
}

// 插件道具基础接口
export interface BasePluginProps {
  editor?: LexicalEditor
  config?: Record<string, any>
}

// 节点数据接口
export interface NodeData {
  id: string
  type: string
  [key: string]: any
}

// 序列化节点接口
export interface SerializedNode<T extends NodeData = NodeData> extends SerializedLexicalNode {
  data: T
}