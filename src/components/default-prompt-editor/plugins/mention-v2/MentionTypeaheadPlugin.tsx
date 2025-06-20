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
import { $createMentionNode, $isMentionNode, type MentionNodeData } from './MentionNode'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

// 菜单选项类
class MentionMenuOption extends MenuOption {
  data: MentionNodeData
  
  constructor(data: MentionNodeData) {
    super(data.id)
    this.data = data
  }
}

interface MentionTypeaheadPluginProps {
  // 用户数据
  mentionOptions: MentionNodeData[]
  // 选择回调
  onSelectMention?: (mention: MentionNodeData) => void
}

export default function MentionTypeaheadPlugin({
  mentionOptions,
  onSelectMention,
}: MentionTypeaheadPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const [queryString, setQueryString] = useState<string | null>(null)
  const [clickedNodeKey, setClickedNodeKey] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // 使用 @ 作为触发字符
  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('@', {
    minLength: 0,
  })

  // 监听点击事件
  useEffect(() => {
    const handleMentionClick = (event: Event) => {
      const customEvent = event as CustomEvent
      const { node } = customEvent.detail
      
      editor.update(() => {
        // 将点击的节点转换为文本节点以便编辑
        const mentionNode = $getNodeByKey(node.getKey())
        if (mentionNode && $isMentionNode(mentionNode)) {
          const textNode = $createTextNode('@')
          mentionNode.replace(textNode)
          
          // 设置光标到文本节点后面
          textNode.select()
          
          // 记录点击的节点，用于后续判断
          setClickedNodeKey(node.getKey())
          // 设置查询字符串为空字符串（不是 null），这样会显示所有选项
          setQueryString('')
        }
      })
    }

    // 监听 mention 节点点击事件
    document.addEventListener('mention-node-click', handleMentionClick)
    
    return () => {
      document.removeEventListener('mention-node-click', handleMentionClick)
    }
  }, [editor])

  // 根据查询字符串过滤选项
  const options = useMemo(() => {
    // 如果 queryString 是 null，说明没有触发菜单，返回空数组
    if (queryString === null) {
      return []
    }

    const searchTerm = queryString.toLowerCase()
    
    return mentionOptions
      .filter(option => 
        option.name.toLowerCase().includes(searchTerm) ||
        (option.email && option.email.toLowerCase().includes(searchTerm))
      )
      .slice(0, 10) // 限制最多显示10个
      .map(option => new MentionMenuOption(option))
  }, [queryString, mentionOptions])

  // 选择选项时的处理
  const onSelectOption = useCallback(
    (
      selectedOption: MentionMenuOption,
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

        // 插入 mention 节点
        const mentionNode = $createMentionNode(selectedOption.data)
        selection.insertNodes([mentionNode])
        
        // 在 mention 后插入空格
        selection.insertNodes([$createTextNode(' ')])
        
        // 调用回调
        if (onSelectMention) {
          onSelectMention(selectedOption.data)
        }
        
        // 清理状态
        setClickedNodeKey(null)
        closeMenu()
      })
    },
    [editor, onSelectMention],
  )

  // 处理查询变化
  const handleQueryChange = useCallback((query: string | null) => {
    setQueryString(query)
    // 如果查询变为 null，清理点击状态
    if (query === null) {
      setClickedNodeKey(null)
    }
  }, [])

  return (
    <LexicalTypeaheadMenuPlugin<MentionMenuOption>
      onQueryChange={handleQueryChange}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        {selectedIndex, selectOptionAndCleanUp, setHighlightedIndex}
      ) =>
        anchorElementRef.current && options.length > 0
          ? ReactDOM.createPortal(
              <MentionMenu
                ref={menuRef}
                options={options}
                selectedIndex={selectedIndex}
                onSelectOption={selectOptionAndCleanUp}
                onSetHighlightedIndex={setHighlightedIndex}
              />,
              anchorElementRef.current,
            )
          : null
      }
    />
  )
}

// Mention 菜单组件
interface MentionMenuProps {
  options: MentionMenuOption[]
  selectedIndex: number | null
  onSelectOption: (option: MentionMenuOption, closeMenu: boolean) => void
  onSetHighlightedIndex: (index: number) => void
}

const MentionMenu = React.forwardRef<HTMLDivElement, MentionMenuProps>(({
  options,
  selectedIndex,
  onSelectOption,
  onSetHighlightedIndex,
}, ref) => {
  return (
    <div className="mention-menu" ref={ref}>
      {options.map((option, index) => (
        <MentionMenuItem
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

MentionMenu.displayName = 'MentionMenu'

// Mention 菜单项组件
interface MentionMenuItemProps {
  option: MentionMenuOption
  isSelected: boolean
  onClick: () => void
  onMouseEnter: () => void
}

function MentionMenuItem({
  option,
  isSelected,
  onClick,
  onMouseEnter,
}: MentionMenuItemProps) {
  const { data } = option
  
  return (
    <div
      className={`mention-menu-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      {data.avatar && (
        <img 
          src={data.avatar} 
          alt={data.name}
          className="mention-menu-avatar"
        />
      )}
      <div className="mention-menu-info">
        <div className="mention-menu-name">{data.name}</div>
        {data.email && (
          <div className="mention-menu-email">{data.email}</div>
        )}
      </div>
      {data.type && (
        <span className={`mention-menu-type mention-menu-type-${data.type}`}>
          {data.type}
        </span>
      )}
    </div>
  )
}