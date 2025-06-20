import './styles.css'

export { RegexBlockNode, $createRegexBlockNode, $isRegexBlockNode } from './RegexBlockNode'
export type { RegexBlockData, SerializedRegexBlockNode, RegexBlockType } from './RegexBlockNode'
export { default as RegexBlockPlugin } from './RegexBlockPlugin'
export { default as RegexBlockTypeaheadPlugin } from './RegexBlockTypeaheadPlugin'
export { default as RegexBlockKeyboardPlugin } from './RegexBlockKeyboardPlugin'

// 组合的 Regex Block 功能组件
import React from 'react'
import RegexBlockPlugin from './RegexBlockPlugin'
import RegexBlockTypeaheadPlugin from './RegexBlockTypeaheadPlugin'
import RegexBlockKeyboardPlugin from './RegexBlockKeyboardPlugin'
import type { RegexBlockData } from './RegexBlockNode'
import type { FeatureProps } from '../plugin.types'

export interface RegexBlockFeatureProps extends FeatureProps<RegexBlockData> {
  regexBlockOptions: RegexBlockData[]
  onSelectRegexBlock?: (regexBlock: RegexBlockData) => void
}

export function RegexBlockFeature({ 
  regexBlockOptions, 
  onSelectRegexBlock 
}: RegexBlockFeatureProps) {
  return (
    <>
      <RegexBlockPlugin />
      <RegexBlockTypeaheadPlugin 
        regexBlockOptions={regexBlockOptions}
        onSelectRegexBlock={onSelectRegexBlock}
      />
      <RegexBlockKeyboardPlugin />
    </>
  )
}