import React, { useCallback } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createTextNode, TextNode } from 'lexical'
import { ComboboxPlugin, type ComboboxOption, type ComboboxTrigger } from '../combobox'
import { $createMentionNode, type MentionNodeData } from '../mention-v2/MentionNode'
import { $createPromptTemplateNode, type PromptTemplateData } from '../prompt-template/PromptTemplateNode'
import { $createRegexBlockNode, type RegexBlockData } from '../regex-block-v2/RegexBlockNode'

export interface UnifiedComboboxFeatureProps {
  // Mention options
  mentionOptions?: MentionNodeData[]
  onSelectMention?: (mention: MentionNodeData) => void
  
  // Template options
  templateOptions?: Array<{ id: string; name: string; template: string }>
  onSelectTemplate?: (template: { id: string; name: string; template: string }) => void
  
  // Variable options (for brackets)
  variableOptions?: Record<string, string[]>
  onSelectVariable?: (variable: string, value: string) => void
  
  // Regex block options
  regexOptions?: Array<{ id: string; name: string; pattern: string }>
  onSelectRegex?: (regex: { id: string; name: string; pattern: string }) => void

  // Command options
  commandOptions?: Array<{ id: string; command: string }>
  onSelectCommand?: (command: { id: string; command: string }) => void
}

export default function UnifiedComboboxFeature({
  mentionOptions = [],
  onSelectMention,
  commandOptions = [],
  onSelectCommand,
  templateOptions = [],
  onSelectTemplate,
  variableOptions = {},
  onSelectVariable,
  regexOptions = [],
  onSelectRegex,
}: UnifiedComboboxFeatureProps): React.JSX.Element {
  const [editor] = useLexicalComposerContext()
  
  const triggers: ComboboxTrigger[] = []
  
  // Mention trigger (@)
  if (mentionOptions.length > 0) {
    triggers.push({
      trigger: '@',
      options: (query: string) => {
        return mentionOptions
          .filter(
            (option) =>
              option.name.toLowerCase().includes(query.toLowerCase()) ||
              (option.email &&
                option.email.toLowerCase().includes(query.toLowerCase()))
          )
          .map((option) => ({
            id: option.id,
            label: option.name,
            value: option.name,
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
            ),
          }));
      },
      onSelect: (option: ComboboxOption, nodeToReplace?: TextNode) => {
        const mentionData = {
          id: option.id,
          name: option.label,
        }
        
        editor.update(() => {
          if (nodeToReplace) {
            const text = nodeToReplace.getTextContent()
            const lastAtIndex = text.lastIndexOf('@')
            
            if (lastAtIndex !== -1) {
              const textBeforeMention = text.substring(0, lastAtIndex)
              const beforeNode = textBeforeMention ? $createTextNode(textBeforeMention) : null
              const mentionNode = $createMentionNode(mentionData)
              const spaceNode = $createTextNode(' ')
              
              if (beforeNode) {
                nodeToReplace.replace(beforeNode)
                beforeNode.insertAfter(mentionNode)
                mentionNode.insertAfter(spaceNode)
              } else {
                nodeToReplace.replace(mentionNode)
                mentionNode.insertAfter(spaceNode)
              }
              
              spaceNode.select()
            }
          }
        })
        
        onSelectMention?.(mentionData)
      }
    })
  }

  // Command trigger (/)
  if (commandOptions.length > 0) {
    triggers.push({
      trigger: '/',
      options: (query: string) => {
        return commandOptions
          .filter(option => 
            option.command.toLowerCase().includes(query.toLowerCase())
          )
          .map(option => ({
            id: option.id,
            label: option.command,
            value: option.command,
            data: option,
            icon: <span className="text-lg">/</span>
          }))
      },
      onSelect: (option: ComboboxOption, nodeToReplace?: TextNode) => {
        const command = option.data as { id: string; command: string }
        
        editor.update(() => {
          if (nodeToReplace) {
            const text = nodeToReplace.getTextContent()
          }
        })
        
      }
    })
  }

  // Template trigger (#)
  if (templateOptions.length > 0) {
    triggers.push({
      trigger: '#',
      options: (query: string) => {
        return templateOptions
          .filter(option => 
            option.name.toLowerCase().includes(query.toLowerCase())
          )
          .map(option => ({
            id: option.id,
            label: option.name,
            value: option.template,
            data: option,
            icon: <span className="text-lg">📝</span>
          }))
      },
      onSelect: (option: ComboboxOption, nodeToReplace?: TextNode) => {
        const template = option.data as { id: string; name: string; template: string }
        
        editor.update(() => {
          if (nodeToReplace) {
            const text = nodeToReplace.getTextContent()
            const lastHashIndex = text.lastIndexOf('#')
            
            if (lastHashIndex !== -1) {
              const textBeforeTemplate = text.substring(0, lastHashIndex)
              const templateNode = $createTextNode(template.template)
              
              if (textBeforeTemplate) {
                const beforeNode = $createTextNode(textBeforeTemplate)
                nodeToReplace.replace(beforeNode)
                beforeNode.insertAfter(templateNode)
              } else {
                nodeToReplace.replace(templateNode)
              }
              
              templateNode.select()
            }
          }
        })
        
        onSelectTemplate?.(template)
      }
    })
  }
  
  // Variable trigger ([)
  if (Object.keys(variableOptions).length > 0) {
    triggers.push({
      trigger: '[',
      options: (query: string) => {
        const allOptions: ComboboxOption[] = []
        
        Object.entries(variableOptions).forEach(([variable, values]) => {
          if (variable.toLowerCase().includes(query.toLowerCase())) {
            // Add the variable itself as an option
            allOptions.push({
              id: `var-${variable}`,
              label: `[${variable}]`,
              value: variable,
              data: { variable, isPlaceholder: true },
              icon: <span className="text-blue-500">[&nbsp;]</span>
            })
          }
        })
        
        return allOptions
      },
      onSelect: (option: ComboboxOption, nodeToReplace?: TextNode) => {
        const { variable, isPlaceholder } = option.data
        
        editor.update(() => {
          if (nodeToReplace) {
            const text = nodeToReplace.getTextContent()
            const lastBracketIndex = text.lastIndexOf('[')
            
            if (lastBracketIndex !== -1) {
              const textBeforeBracket = text.substring(0, lastBracketIndex)
              const beforeNode = textBeforeBracket ? $createTextNode(textBeforeBracket) : null
              
              const templateData: PromptTemplateData = {
                parameterName: variable,
                type: 'square',
                options: variableOptions[variable] || []
              }
              const templateNode = $createPromptTemplateNode(templateData)
              const spaceNode = $createTextNode(' ')
              
              if (beforeNode) {
                nodeToReplace.replace(beforeNode)
                beforeNode.insertAfter(templateNode)
                templateNode.insertAfter(spaceNode)
              } else {
                nodeToReplace.replace(templateNode)
                templateNode.insertAfter(spaceNode)
              }
              
              spaceNode.select()
            }
          }
        })
        
        if (isPlaceholder) {
          // Variable placeholder was selected
          console.log(`Variable [${variable}] inserted`)
        }
      }
    })
  }
    
  return (
    <ComboboxPlugin
      triggers={triggers}
      maxResults={10}
      menuClassName="unified-combobox-menu"
      itemClassName="unified-combobox-item"
      selectedItemClassName="unified-combobox-item-selected"
    />
  )
}