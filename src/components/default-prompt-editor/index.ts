// 主组件
export { default as PromptEditor, default } from './PromptEditor'
export type { PromptEditorProps } from './PromptEditor'

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

// 插件导出
export * from './plugins/prompt-template'
export * from './plugins/regex-block-v2'
export * from './plugins/mention-v2'
export * from './plugins/combobox'
export * from './plugins/unified-combobox'
export * from './plugins/keyboard'

// 工具函数
export * from './utils'

// 类型
export * from './types'

// 兼容性类型 - 支持从 prompt-editor 迁移
export type {
  PromptTemplate,
  BracketParameterOptions,
  SelectedOption,
  BracketFormatConfig,
  ErrorType,
  ErrorSeverity,
  ErrorInfo
} from './compatibility-types'
export { DEFAULT_BRACKET_FORMATS } from './compatibility-types'