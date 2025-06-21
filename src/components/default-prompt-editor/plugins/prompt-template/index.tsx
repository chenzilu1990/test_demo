import './styles.css'

export { PromptTemplateNode, $createPromptTemplateNode, $isPromptTemplateNode } from './PromptTemplateNode'
export type { PromptTemplateData, SerializedPromptTemplateNode, PromptTemplateType } from './PromptTemplateNode'
export { default as PromptTemplatePlugin } from './PromptTemplatePlugin'
export { default as PromptTemplateTypeaheadPlugin } from './PromptTemplateTypeaheadPlugin'

// 组合的 Prompt Template 功能组件
import React from 'react'
import PromptTemplatePlugin from './PromptTemplatePlugin'
import PromptTemplateTypeaheadPlugin from './PromptTemplateTypeaheadPlugin'
import type { FeatureProps } from '../plugin.types'

export interface PromptTemplateFeatureProps extends FeatureProps {
  parameterOptions?: Record<string, string[]>
  onSelectOption?: (parameterName: string, selectedValue: string) => void
}

export function PromptTemplateFeature({ 
  parameterOptions = {},
  onSelectOption
}: PromptTemplateFeatureProps) {
  return (
    <>
      <PromptTemplatePlugin parameterOptions={parameterOptions} />
      <PromptTemplateTypeaheadPlugin 
        parameterOptions={parameterOptions}
        onSelectOption={onSelectOption}
      />
    </>
  )
}