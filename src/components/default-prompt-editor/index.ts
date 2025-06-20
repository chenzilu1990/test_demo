// 主组件
export { default as PromptEditor, default } from './index.tsx'
export type { PromptEditorProps } from './index.tsx'

// 编辑器类型
export type {
  EditorContent,
  EditorEventHandlers,
  EditorConfiguration,
  EditorRef,
  EditorTheme,
  ToolbarConfig,
  ToolbarItem,
  BasePluginProps,
  NodeData,
  SerializedNode
} from './editor.types'

// 插件类型
export type {
  BasePlugin,
  Plugin,
  PluginComponentProps,
  FeatureProps,
  TypeaheadConfig,
  MenuOption,
  MenuProps,
  NodePlugin,
  DecoratorPlugin,
  CommandPlugin,
  PluginManager,
  PluginLifecycle
} from './plugins/plugin.types'

// 插件管理器
export { PluginProvider, PluginContainer, usePluginManager } from './plugins/PluginManager'

// 工具函数
export * from './utils'

// 类型
export * from './types'