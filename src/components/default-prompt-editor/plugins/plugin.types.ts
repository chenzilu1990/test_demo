import type { LexicalEditor, LexicalNode } from 'lexical'
import type { ReactNode } from 'react'

// 基础插件接口
export interface BasePlugin {
  name: string
  nodes?: Array<typeof LexicalNode>
}

// 插件组件的 Props
export interface PluginComponentProps<T = any> {
  options?: T[]
  onSelect?: (item: T) => void
  config?: Record<string, any>
}

// Feature 组件的 Props
export interface FeatureProps<T = any> extends PluginComponentProps<T> {
  priority?: number
}

// Typeahead 插件配置
export interface TypeaheadConfig {
  trigger: string
  minLength?: number
  maxLength?: number
}

// 菜单选项接口
export interface MenuOption<T = any> {
  key: string
  data: T
}

// 菜单组件 Props
export interface MenuProps<T = any> {
  options: MenuOption<T>[]
  selectedIndex: number
  onSelectOption: (option: MenuOption<T>, closeMenu: boolean) => void
  onSetHighlightedIndex: (index: number) => void
}

// 节点插件接口
export interface NodePlugin<T = any> extends BasePlugin {
  createNode: (data: T) => LexicalNode
  isNode: (node: any) => boolean
  exportJSON?: (node: LexicalNode) => any
  importJSON?: (json: any) => LexicalNode
}

// 装饰器插件接口
export interface DecoratorPlugin extends BasePlugin {
  decorate: (editor: LexicalEditor) => ReactNode
}

// 命令插件接口
export interface CommandPlugin extends BasePlugin {
  commands: Array<{
    command: string
    handler: (payload: any, editor: LexicalEditor) => boolean
    priority?: number
  }>
}

// 插件管理器接口
export interface PluginManager {
  register(plugin: BasePlugin): void
  unregister(pluginName: string): void
  getPlugin(name: string): BasePlugin | undefined
  getAllPlugins(): BasePlugin[]
}

// 插件生命周期钩子
export interface PluginLifecycle {
  onMount?: (editor: LexicalEditor) => void
  onUnmount?: (editor: LexicalEditor) => void
  onUpdate?: (editor: LexicalEditor) => void
}

// 完整的插件接口
export interface Plugin extends BasePlugin, Partial<PluginLifecycle> {
  component?: ReactNode
  init?: (editor: LexicalEditor) => void | (() => void)
}