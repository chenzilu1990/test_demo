import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import type { TextNode } from 'lexical'
import { 
  $createTextNode, 
  $getSelection, 
  $isRangeSelection,
  $getNodeByKey,
} from 'lexical'
import { $createRegexBlockNode, $isRegexBlockNode, type RegexBlockData, type RegexBlockType } from './RegexBlockNode'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

// 菜单选项类
class RegexBlockMenuOption extends MenuOption {
  data: RegexBlockData
  
  constructor(data: RegexBlockData) {
    super(data.id)
    this.data = data
  }
}

// 触发器配置
const TRIGGERS = {
  '[': { type: 'square' as RegexBlockType, pattern: /\[([^\[\]]*)$/ },
  '{': { type: 'curly' as RegexBlockType, pattern: /\{([^{}]*)$/ },
  '{{': { type: 'double-curly' as RegexBlockType, pattern: /\{\{([^{}]*)$/ },
}

interface RegexBlockTypeaheadPluginProps {
  // 选项数据
  regexBlockOptions: RegexBlockData[]
  // 选择回调
  onSelectRegexBlock?: (regexBlock: RegexBlockData) => void
}

export default function RegexBlockTypeaheadPlugin({
  regexBlockOptions,
  onSelectRegexBlock,
}: RegexBlockTypeaheadPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const [queryString, setQueryString] = useState<string | null>(null)
  const [clickedNodeKey, setClickedNodeKey] = useState<string | null>(null)
  const [triggerType, setTriggerType] = useState<RegexBlockType | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // 使用多个触发器
  const checkForSquareTriggerMatch = useBasicTypeaheadTriggerMatch('[', { minLength: 0 })
  const checkForCurlyTriggerMatch = useBasicTypeaheadTriggerMatch('{', { minLength: 0 })

  // 监听点击事件
  useEffect(() => {
    const handleRegexBlockClick = (event: Event) => {
      const customEvent = event as CustomEvent
      const { node, data } = customEvent.detail
      
      editor.update(() => {
        // 将点击的节点转换为对应的触发文本
        const regexBlockNode = $getNodeByKey(node.getKey())
        if (regexBlockNode && $isRegexBlockNode(regexBlockNode)) {
          let triggerText = ''
          let type: RegexBlockType = data.type
          
          switch (data.type) {
            case 'square':
              triggerText = '['
              break
            case 'curly':
              triggerText = '{'
              break
            case 'double-curly':
              triggerText = '{{'
              break
          }
          
          const textNode = $createTextNode(triggerText)
          regexBlockNode.replace(textNode)
          
          // 设置光标到文本节点后面
          textNode.select()
          
          // 记录点击的节点和类型
          setClickedNodeKey(node.getKey())
          setTriggerType(type)
          // 设置查询字符串为空字符串，显示所有选项
          setQueryString('')
        }
      })
    }

    // 监听 regex block 节点点击事件
    document.addEventListener('regex-block-click', handleRegexBlockClick)
    
    return () => {
      document.removeEventListener('regex-block-click', handleRegexBlockClick)
    }
  }, [editor])

  // 根据查询字符串过滤选项
  const options = useMemo(() => {
    // 如果 queryString 是 null，说明没有触发菜单，返回空数组
    if (queryString === null) {
      return []
    }

    const searchTerm = queryString.toLowerCase()
    
    return regexBlockOptions
      .filter(option => {
        // 如果有特定的触发类型，只显示对应类型的选项
        if (triggerType && option.type !== triggerType) {
          return false
        }
        
        return option.content.toLowerCase().includes(searchTerm) ||
               (option.description && option.description.toLowerCase().includes(searchTerm)) ||
               (option.category && option.category.toLowerCase().includes(searchTerm))
      })
      .slice(0, 10) // 限制最多显示10个
      .map(option => new RegexBlockMenuOption(option))
  }, [queryString, regexBlockOptions, triggerType])

  // 选择选项时的处理
  const onSelectOption = useCallback(
    (
      selectedOption: RegexBlockMenuOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const selection = $getSelection()
        
        if (!$isRangeSelection(selection) || selectedOption == null) {
          return
        }

        // 移除触发文本
        if (nodeToReplace) {
          nodeToReplace.remove()
        }

        // 插入 regex block 节点
        const regexBlockNode = $createRegexBlockNode(selectedOption.data)
        selection.insertNodes([regexBlockNode])
        
        // 在 regex block 后插入空格
        selection.insertNodes([$createTextNode(' ')])
        
        // 调用回调
        if (onSelectRegexBlock) {
          onSelectRegexBlock(selectedOption.data)
        }
        
        // 清理状态
        setClickedNodeKey(null)
        setTriggerType(null)
        closeMenu()
      })
    },
    [editor, onSelectRegexBlock],
  )

  // 处理查询变化
  const handleQueryChange = useCallback((query: string | null) => {
    setQueryString(query)
    // 如果查询变为 null，清理点击状态
    if (query === null) {
      setClickedNodeKey(null)
      setTriggerType(null)
    }
  }, [])

  // 组合触发器函数
  const combinedTriggerFn = useCallback((text: string, editor: any) => {
    // 优先级策略：双花括号 > 单花括号 > 方括号
    
    // 1. 检查双花括号 - 匹配 {{ 开头的模式
    const doubleCurlyMatch = /\{\{([^}]*)$/.exec(text)
    if (doubleCurlyMatch) {
      setTriggerType('double-curly')
      return {
        leadOffset: doubleCurlyMatch[0].length,
        matchingString: doubleCurlyMatch[1] || '',
        replaceableString: doubleCurlyMatch[0],
      }
    }
    
    // 2. 检查单花括号 - 使用更简单的方式
    const curlyMatch = /\{([^{}]*)$/.exec(text)
    if (curlyMatch) {
      // 如果匹配到的是 {{ 开头，已经在上面处理了
      // 这里只处理单个 {
      const fullMatch = curlyMatch[0]
      
      // 如果只是一个单独的 {，且没有后续内容，延迟触发
      if (fullMatch === '{') {
        // 不立即触发，给用户输入第二个 { 的机会
        return null
      }
      
      // 如果 { 后面有内容（非空），则触发单花括号
      setTriggerType('curly')
      return {
        leadOffset: fullMatch.length,
        matchingString: curlyMatch[1] || '',
        replaceableString: fullMatch,
      }
    }
    
    // 3. 检查方括号
    const squareMatch = checkForSquareTriggerMatch(text, editor)
    if (squareMatch) {
      setTriggerType('square')
      return squareMatch
    }
    
    return null
  }, [checkForSquareTriggerMatch])

  return (
    <LexicalTypeaheadMenuPlugin<RegexBlockMenuOption>
      onQueryChange={handleQueryChange}
      onSelectOption={onSelectOption}
      triggerFn={combinedTriggerFn}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        {selectedIndex, selectOptionAndCleanUp, setHighlightedIndex}
      ) =>
        anchorElementRef.current && options.length > 0
          ? ReactDOM.createPortal(
              <RegexBlockMenu
                ref={menuRef}
                options={options}
                selectedIndex={selectedIndex}
                onSelectOption={selectOptionAndCleanUp}
                onSetHighlightedIndex={setHighlightedIndex}
                triggerType={triggerType}
              />,
              anchorElementRef.current,
            )
          : null
      }
    />
  )
}

// Regex Block 菜单组件
interface RegexBlockMenuProps {
  options: RegexBlockMenuOption[]
  selectedIndex: number | null
  onSelectOption: (option: RegexBlockMenuOption, closeMenu: boolean) => void
  onSetHighlightedIndex: (index: number) => void
  triggerType: RegexBlockType | null
}

const RegexBlockMenu = React.forwardRef<HTMLDivElement, RegexBlockMenuProps>(({
  options,
  selectedIndex,
  onSelectOption,
  onSetHighlightedIndex,
  triggerType,
}, ref) => {
  const getTypeLabel = (type: RegexBlockType) => {
    switch (type) {
      case 'square': return '方括号块'
      case 'curly': return '花括号块'
      case 'double-curly': return '双花括号块'
      default: return '模板块'
    }
  }

  return (
    <div className="regex-block-menu" ref={ref}>
      {triggerType && (
        <div className="regex-block-menu-header">
          选择{getTypeLabel(triggerType)}
        </div>
      )}
      {options.map((option, index) => (
        <RegexBlockMenuItem
          key={option.key}
          option={option}
          isSelected={selectedIndex === index}
          onClick={() => onSelectOption(option, true)}
          onMouseEnter={() => onSetHighlightedIndex(index)}
        />
      ))}
    </div>
  )
})

RegexBlockMenu.displayName = 'RegexBlockMenu'

// Regex Block 菜单项组件
interface RegexBlockMenuItemProps {
  option: RegexBlockMenuOption
  isSelected: boolean
  onClick: () => void
  onMouseEnter: () => void
}

function RegexBlockMenuItem({
  option,
  isSelected,
  onClick,
  onMouseEnter,
}: RegexBlockMenuItemProps) {
  const { data } = option
  
  const getTypeIcon = (type: RegexBlockType) => {
    switch (type) {
      case 'square': return '[]'
      case 'curly': return '{}'
      case 'double-curly': return '{{}}'
      default: return '[]'
    }
  }
  
  return (
    <div
      className={`regex-block-menu-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <div className="regex-block-menu-icon">
        {getTypeIcon(data.type)}
      </div>
      <div className="regex-block-menu-info">
        <div className="regex-block-menu-content">{data.content}</div>
        {data.description && (
          <div className="regex-block-menu-description">{data.description}</div>
        )}
      </div>
      {data.category && (
        <span className={`regex-block-menu-category regex-block-menu-category-${data.type}`}>
          {data.category}
        </span>
      )}
    </div>
  )
}