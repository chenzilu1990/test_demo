import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $getNodeByKey,
  $isTextNode,
  COMMAND_PRIORITY_NORMAL,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  TextNode,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import { createPortal } from 'react-dom'

export interface ComboboxOption {
  id: string
  label: string
  value: string
  data?: any
  icon?: React.ReactNode
}

export interface ComboboxTrigger {
  trigger: string
  options: ComboboxOption[] | ((query: string) => ComboboxOption[] | Promise<ComboboxOption[]>)
  onSelect: (option: ComboboxOption, nodeToReplace?: TextNode) => void
}

export interface ComboboxPluginProps {
  triggers: ComboboxTrigger[]
  maxResults?: number
  menuClassName?: string
  itemClassName?: string
  selectedItemClassName?: string
}

interface MenuState {
  isOpen: boolean
  triggerIndex: number | null
  query: string
  selectedIndex: number
  position: { x: number; y: number } | null
  nodeToReplace: TextNode | null
}

const DEFAULT_MAX_RESULTS = 10

export default function ComboboxPlugin({
  triggers,
  maxResults = DEFAULT_MAX_RESULTS,
  menuClassName = '',
  itemClassName = '',
  selectedItemClassName = '',
}: ComboboxPluginProps): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const [menuState, setMenuState] = useState<MenuState>({
    isOpen: false,
    triggerIndex: null,
    query: '',
    selectedIndex: 0,
    position: null,
    nodeToReplace: null,
  })
  const menuRef = useRef<HTMLDivElement>(null)
  const [options, setOptions] = useState<ComboboxOption[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Check for trigger match
  const checkForTriggerMatch = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
      return null
    }

    const node = selection.anchor.getNode()
    if (!$isTextNode(node)) {
      return null
    }

    const text = node.getTextContent()
    const offset = selection.anchor.offset
    
    // Check each trigger
    for (let i = 0; i < triggers.length; i++) {
      const trigger = triggers[i].trigger
      const triggerLength = trigger.length
      
      // Look for trigger before cursor
      for (let j = 0; j <= offset - triggerLength; j++) {
        if (text.slice(j, j + triggerLength) === trigger) {
          // Found trigger, extract query
          const query = text.slice(j + triggerLength, offset)
          
          // Check if there's a space before this position (except at start)
          if (j > 0 && text[j - 1] !== ' ' && text[j - 1] !== '\n') {
            continue
          }
          
          return {
            triggerIndex: i,
            query,
            node,
            startOffset: j,
            endOffset: offset,
          }
        }
      }
    }
    
    return null
  }, [triggers])

  // Get filtered options
  const getFilteredOptions = useCallback(async (triggerIndex: number, query: string) => {
    const trigger = triggers[triggerIndex]
    if (!trigger) return []

    setIsLoading(true)
    try {
      let allOptions: ComboboxOption[] = []
      
      if (typeof trigger.options === 'function') {
        allOptions = await trigger.options(query)
      } else {
        allOptions = trigger.options
      }
      
      // Filter by query
      const filtered = query
        ? allOptions.filter(option => 
            option.label.toLowerCase().includes(query.toLowerCase()) ||
            option.value.toLowerCase().includes(query.toLowerCase())
          )
        : allOptions
      
      return filtered.slice(0, maxResults)
    } finally {
      setIsLoading(false)
    }
  }, [triggers, maxResults])

  // Update menu position
  const updateMenuPosition = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return null

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    
    return {
      x: rect.left,
      y: rect.bottom + 5,
    }
  }, [])

  // Handle text changes
  const handleTextChange = useCallback(() => {
    editor.getEditorState().read(() => {
      const match = checkForTriggerMatch()
      
      if (match) {
        const position = updateMenuPosition()
        setMenuState({
          isOpen: true,
          triggerIndex: match.triggerIndex,
          query: match.query,
          selectedIndex: 0,
          position,
          nodeToReplace: match.node,
        })
        
        // Load options
        getFilteredOptions(match.triggerIndex, match.query).then(setOptions)
      } else if (menuState.isOpen) {
        setMenuState({
          isOpen: false,
          triggerIndex: null,
          query: '',
          selectedIndex: 0,
          position: null,
          nodeToReplace: null,
        })
        setOptions([])
      }
    })
  }, [editor, checkForTriggerMatch, updateMenuPosition, getFilteredOptions, menuState.isOpen])

  // Handle option selection
  const selectOption = useCallback((option: ComboboxOption) => {
    if (menuState.triggerIndex === null || !menuState.nodeToReplace) return

    const trigger = triggers[menuState.triggerIndex]
    
    editor.update(() => {
      trigger.onSelect(option, menuState.nodeToReplace || undefined)
    })

    // Close menu
    setMenuState({
      isOpen: false,
      triggerIndex: null,
      query: '',
      selectedIndex: 0,
      position: null,
      nodeToReplace: null,
    })
    setOptions([])
  }, [editor, triggers, menuState])

  // Keyboard navigation
  useEffect(() => {
    if (!menuState.isOpen) return

    return mergeRegister(
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          if (event) {
            event.preventDefault()
          }
          setMenuState(prev => ({
            ...prev,
            selectedIndex: Math.min(prev.selectedIndex + 1, options.length - 1)
          }))
          return true
        },
        COMMAND_PRIORITY_NORMAL
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          if (event) {
            event.preventDefault()
          }
          setMenuState(prev => ({
            ...prev,
            selectedIndex: Math.max(prev.selectedIndex - 1, 0)
          }))
          return true
        },
        COMMAND_PRIORITY_NORMAL
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (options.length > 0 && menuState.selectedIndex < options.length) {
            if (event) {
              event.preventDefault()
            }
            selectOption(options[menuState.selectedIndex])
            return true
          }
          return false
        },
        COMMAND_PRIORITY_NORMAL
      ),
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (event) => {
          if (options.length > 0 && menuState.selectedIndex < options.length) {
            if (event) {
              event.preventDefault()
            }
            selectOption(options[menuState.selectedIndex])
            return true
          }
          return false
        },
        COMMAND_PRIORITY_NORMAL
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          setMenuState({
            isOpen: false,
            triggerIndex: null,
            query: '',
            selectedIndex: 0,
            position: null,
            nodeToReplace: null,
          })
          setOptions([])
          return true
        },
        COMMAND_PRIORITY_NORMAL
      )
    )
  }, [editor, menuState.isOpen, menuState.selectedIndex, options, selectOption])

  // Listen to editor updates
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      handleTextChange()
    })
  }, [editor, handleTextChange])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuState({
          isOpen: false,
          triggerIndex: null,
          query: '',
          selectedIndex: 0,
          position: null,
          nodeToReplace: null,
        })
        setOptions([])
      }
    }

    if (menuState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuState.isOpen])

  // Render menu
  if (!menuState.isOpen || !menuState.position) {
    return null
  }

  return createPortal(
    <div
      ref={menuRef}
      className={`combobox-menu ${menuClassName}`}
      style={{
        position: 'fixed',
        left: `${menuState.position.x}px`,
        top: `${menuState.position.y}px`,
        zIndex: 10000,
      }}
    >
      {isLoading ? (
        <div className="p-2 text-gray-500">Loading...</div>
      ) : options.length === 0 ? (
        <div className="p-2 text-gray-500">No results</div>
      ) : (
        <ul className="max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <li
              key={option.id}
              className={`combobox-item ${itemClassName} ${
                index === menuState.selectedIndex ? `combobox-item-selected ${selectedItemClassName}` : ''
              }`}
              onClick={() => selectOption(option)}
              onMouseEnter={() => setMenuState(prev => ({ ...prev, selectedIndex: index }))}
            >
              {option.icon && <span className="combobox-item-icon">{option.icon}</span>}
              <span className="combobox-item-label">{option.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>,
    document.body
  )
}