import './styles.css'

export { MentionNode, $createMentionNode, $isMentionNode } from './MentionNode'
export type { MentionNodeData, SerializedMentionNode } from './MentionNode'
export { default as MentionPlugin } from './MentionPlugin'
export { default as MentionTypeaheadPlugin } from './MentionTypeaheadPlugin'
export { default as MentionKeyboardPlugin } from './MentionKeyboardPlugin'

// 组合的 Mention 功能组件
import React from 'react'
import MentionPlugin from './MentionPlugin'
import MentionTypeaheadPlugin from './MentionTypeaheadPlugin'
import MentionKeyboardPlugin from './MentionKeyboardPlugin'
import type { MentionNodeData } from './MentionNode'
import type { FeatureProps } from '../plugin.types'

export interface MentionFeatureProps extends FeatureProps<MentionNodeData> {
  mentionOptions: MentionNodeData[]
  onSelectMention?: (mention: MentionNodeData) => void
}

export function MentionFeature({ 
  mentionOptions, 
  onSelectMention 
}: MentionFeatureProps) {
  return (
    <>
      <MentionPlugin />
      <MentionTypeaheadPlugin 
        mentionOptions={mentionOptions}
        onSelectMention={onSelectMention}
      />
      <MentionKeyboardPlugin />
    </>
  )
}