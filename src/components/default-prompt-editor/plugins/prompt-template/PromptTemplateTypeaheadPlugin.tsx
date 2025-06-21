import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, CLICK_COMMAND, COMMAND_PRIORITY_HIGH } from 'lexical'
import { $isPromptTemplateNode, type PromptTemplateData } from './PromptTemplateNode'
import { createPortal } from 'react-dom'

export interface PromptTemplateTypeaheadPluginProps {
  parameterOptions?: Record<string, string[]>
  onSelectOption?: (parameterName: string, selectedValue: string) => void
}

interface MenuState {
  isOpen: boolean
  node: any
  data: PromptTemplateData | null
  position: { x: number; y: number } | null
}

export default function PromptTemplateTypeaheadPlugin({
  parameterOptions = {},
  onSelectOption
}: PromptTemplateTypeaheadPluginProps): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const [menuState, setMenuState] = useState<MenuState>({
    isOpen: false,
    node: null,
    data: null,
    position: null
  })
  const menuRef = useRef<HTMLDivElement>(null)

  // 处理点击事件
  const handleTemplateClick = useCallback((event: CustomEvent) => {
    const { node, data, element } = event.detail
    const rect = element.getBoundingClientRect()
    
    setMenuState({
      isOpen: true,
      node,
      data,
      position: {
        x: rect.left,
        y: rect.bottom + 5
      }
    })
  }, [])

  // 处理选项选择
  const handleOptionSelect = useCallback((option: string) => {
    if (!menuState.node || !menuState.data) return

    editor.update(() => {
      menuState.node.setSelectedValue(option)
    })

    if (onSelectOption && menuState.data) {
      onSelectOption(menuState.data.parameterName, option)
    }

    setMenuState({
      isOpen: false,
      node: null,
      data: null,
      position: null
    })
  }, [editor, menuState, onSelectOption])

  // 处理点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuState({
          isOpen: false,
          node: null,
          data: null,
          position: null
        })
      }
    }

    if (menuState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuState.isOpen])

  // 监听自定义事件
  useEffect(() => {
    const editorElement = editor.getRootElement()
    if (!editorElement) return

    editorElement.addEventListener('prompt-template-click', handleTemplateClick as EventListener)

    return () => {
      editorElement.removeEventListener('prompt-template-click', handleTemplateClick as EventListener)
    }
  }, [editor, handleTemplateClick])

  // 监听 Lexical 的点击命令
  useEffect(() => {
    return editor.registerCommand(
      CLICK_COMMAND,
      (event: MouseEvent) => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return false

        const node = selection.anchor.getNode()
        if ($isPromptTemplateNode(node)) {
          const data = node.getTemplateData()
          const element = editor.getElementByKey(node.getKey())
          
          if (element) {
            const rect = element.getBoundingClientRect()
            setMenuState({
              isOpen: true,
              node,
              data,
              position: {
                x: rect.left,
                y: rect.bottom + 5
              }
            })
            return true
          }
        }
        
        return false
      },
      COMMAND_PRIORITY_HIGH
    )
  }, [editor])

  // 渲染菜单
  if (!menuState.isOpen || !menuState.data || !menuState.position) {
    return null
  }

  const options = parameterOptions[menuState.data.parameterName] || []
  
  if (options.length === 0) {
    return null
  }

  return createPortal(
    <div
      ref={menuRef}
      className="prompt-template-menu"
      style={{
        position: 'fixed',
        left: `${menuState.position.x}px`,
        top: `${menuState.position.y}px`,
        zIndex: 1000
      }}
    >
      <div className="prompt-template-menu-content">
        <div className="prompt-template-menu-header">
          选择 {menuState.data.parameterName}
        </div>
        <div className="prompt-template-menu-options">
          {options.map((option, index) => (
            <div
              key={index}
              className="prompt-template-menu-option"
              onClick={() => handleOptionSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}