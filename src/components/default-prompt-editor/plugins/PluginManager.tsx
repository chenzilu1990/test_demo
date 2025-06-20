import React, { createContext, useContext, useEffect, useMemo } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { LexicalEditor } from 'lexical'
import type { Plugin, PluginManager as IPluginManager } from './plugin.types'

// 插件上下文
const PluginContext = createContext<IPluginManager | null>(null)

// 插件管理器钩子
export function usePluginManager() {
  const manager = useContext(PluginContext)
  if (!manager) {
    throw new Error('usePluginManager must be used within PluginProvider')
  }
  return manager
}

// 插件管理器实现
class PluginManagerImpl implements IPluginManager {
  private plugins: Map<string, Plugin> = new Map()
  private editor: LexicalEditor | null = null

  setEditor(editor: LexicalEditor) {
    this.editor = editor
  }

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" is already registered`)
      return
    }

    this.plugins.set(plugin.name, plugin)

    // 如果编辑器已经初始化，立即初始化插件
    if (this.editor && plugin.init) {
      plugin.init(this.editor)
    }
  }

  unregister(pluginName: string): void {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) return

    // 清理插件
    if (this.editor && plugin.onUnmount) {
      plugin.onUnmount(this.editor)
    }

    this.plugins.delete(pluginName)
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name)
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  // 初始化所有插件
  initializePlugins(editor: LexicalEditor) {
    this.editor = editor
    this.plugins.forEach(plugin => {
      if (plugin.init) {
        const cleanup = plugin.init(editor)
        if (cleanup) {
          // 存储清理函数
          plugin.onUnmount = cleanup
        }
      }
      if (plugin.onMount) {
        plugin.onMount(editor)
      }
    })
  }

  // 清理所有插件
  cleanupPlugins() {
    if (!this.editor) return

    this.plugins.forEach(plugin => {
      if (plugin.onUnmount) {
        plugin.onUnmount(this.editor!)
      }
    })
  }
}

// 插件提供者组件
export function PluginProvider({ 
  children, 
  plugins = [] 
}: { 
  children: React.ReactNode
  plugins?: Plugin[]
}) {
  const [editor] = useLexicalComposerContext()
  
  const manager = useMemo(() => {
    const mgr = new PluginManagerImpl()
    
    // 注册所有插件
    plugins.forEach(plugin => mgr.register(plugin))
    
    return mgr
  }, [])

  useEffect(() => {
    manager.initializePlugins(editor)
    
    return () => {
      manager.cleanupPlugins()
    }
  }, [editor, manager])

  return (
    <PluginContext.Provider value={manager}>
      {children}
    </PluginContext.Provider>
  )
}

// 插件容器组件
export function PluginContainer() {
  const manager = usePluginManager()
  const plugins = manager.getAllPlugins()

  return (
    <>
      {plugins.map(plugin => {
        const p = plugin as Plugin
        return p.component ? (
          <React.Fragment key={p.name}>
            {p.component}
          </React.Fragment>
        ) : null
      })}
    </>
  )
}