import React, { useCallback } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createTextNode, TextNode } from 'lexical'
import { $createMentionNode, type MentionNodeData } from './MentionNode'
import { ComboboxPlugin, type ComboboxOption, type ComboboxTrigger } from '../combobox'

interface MentionTypeaheadPluginProps {
  mentionOptions: MentionNodeData[]
  onSelectMention?: (mention: MentionNodeData) => void
}

export default function MentionTypeaheadPlugin({
  mentionOptions,
  onSelectMention,
}: MentionTypeaheadPluginProps): React.JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  // Convert mention options to combobox options
  const convertToComboboxOptions = useCallback((query: string): ComboboxOption[] => {
    return mentionOptions
      .filter(option => 
        option.name.toLowerCase().includes(query.toLowerCase()) ||
        (option.email && option.email.toLowerCase().includes(query.toLowerCase()))
      )
      .map(option => ({
        id: option.id,
        label: option.name,
        value: option.email || option.name,
        data: option,
        icon: option.avatar ? (
          <img 
            src={option.avatar} 
            alt={option.name} 
            className="w-5 h-5 rounded-full"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs">
            {option.name.charAt(0).toUpperCase()}
          </div>
        )
      }))
  }, [mentionOptions])

  // Handle mention selection
  const handleMentionSelect = useCallback((option: ComboboxOption, nodeToReplace?: TextNode) => {
    const mentionData = option.data as MentionNodeData
    
    editor.update(() => {
      if (nodeToReplace) {
        // Get the text content and find the trigger position
        const text = nodeToReplace.getTextContent()
        const lastAtIndex = text.lastIndexOf('@')
        
        if (lastAtIndex !== -1) {
          // Split the node at the @ position
          const textBeforeMention = text.substring(0, lastAtIndex)
          const textAfterMention = text.substring(lastAtIndex + text.length)
          
          // Create nodes
          const beforeNode = textBeforeMention ? $createTextNode(textBeforeMention) : null
          const mentionNode = $createMentionNode(mentionData)
          const afterNode = textAfterMention ? $createTextNode(textAfterMention) : null
          
          // Replace the original node
          if (beforeNode) {
            nodeToReplace.replace(beforeNode)
            beforeNode.insertAfter(mentionNode)
            if (afterNode) {
              mentionNode.insertAfter(afterNode)
              afterNode.select()
            } else {
              // Add a space after mention
              const spaceNode = $createTextNode(' ')
              mentionNode.insertAfter(spaceNode)
              spaceNode.select()
            }
          } else {
            nodeToReplace.replace(mentionNode)
            if (afterNode) {
              mentionNode.insertAfter(afterNode)
              afterNode.select()
            } else {
              // Add a space after mention
              const spaceNode = $createTextNode(' ')
              mentionNode.insertAfter(spaceNode)
              spaceNode.select()
            }
          }
        }
      }
    })

    // Call the callback
    if (onSelectMention) {
      onSelectMention(mentionData)
    }
  }, [editor, onSelectMention])

  // Create trigger configuration
  const mentionTrigger: ComboboxTrigger = {
    trigger: '@',
    options: convertToComboboxOptions,
    onSelect: handleMentionSelect,
  }

  return (
    <ComboboxPlugin
      triggers={[mentionTrigger]}
      maxResults={10}
      menuClassName="mention-menu"
      itemClassName="mention-item"
      selectedItemClassName="mention-item-selected"
    />
  )
}