import type { 
  EditorConfig, 
  LexicalNode, 
  NodeKey, 
  SerializedTextNode,
  Spread
} from 'lexical'
import { 
  TextNode,
  $applyNodeReplacement
} from 'lexical'

export type PromptTemplateType = 'square' | 'curly' | 'double-curly' | 'selected'

export type PromptTemplateData = {
  parameterName: string
  type: PromptTemplateType
  options?: string[]
  selectedValue?: string
  isSelected?: boolean
}

export type SerializedPromptTemplateNode = Spread<{
  data: PromptTemplateData
  type: 'prompt-template'
  version: 1
}, SerializedTextNode>

export class PromptTemplateNode extends TextNode {
  __data: PromptTemplateData

  static getType(): string {
    return 'prompt-template'
  }

  static clone(node: PromptTemplateNode): PromptTemplateNode {
    return new PromptTemplateNode(node.__data, node.__text, node.__key)
  }

  constructor(data: PromptTemplateData, text?: string, key?: NodeKey) {
    // 如果有选中的值，显示该值；否则显示包装后的参数名
    const displayText = data.selectedValue || text || PromptTemplateNode.getWrappedText(data.parameterName, data.type)
    super(displayText, key)
    this.__data = data
  }

  // 根据类型获取包装后的文本
  static getWrappedText(parameterName: string, type: PromptTemplateType): string {
    switch (type) {
      case 'square':
        return `[${parameterName}]`
      case 'curly':
        return `{${parameterName}}`
      case 'double-curly':
        return `{{${parameterName}}}`
      default:
        return parameterName
    }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config)
    
    // 根据是否选中应用不同的样式
    if (this.__data.isSelected) {
      element.className = 'prompt-template-node prompt-template-selected'
    } else {
      element.className = 'prompt-template-node prompt-template-parameter'
    }
    
    element.setAttribute('data-parameter-name', this.__data.parameterName)
    element.setAttribute('data-template-type', this.__data.type)
    
    if (this.__data.selectedValue) {
      element.setAttribute('data-selected-value', this.__data.selectedValue)
    }
    
    // 添加点击事件处理
    element.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      
      // 触发自定义事件，通知需要显示选项菜单
      const customEvent = new CustomEvent('prompt-template-click', {
        detail: {
          node: this,
          data: this.__data,
          element: element
        },
        bubbles: true
      })
      element.dispatchEvent(customEvent)
    })
    
    return element
  }

  updateDOM(
    prevNode: PromptTemplateNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config)
    
    // 更新类名
    if (prevNode.__data.isSelected !== this.__data.isSelected) {
      if (this.__data.isSelected) {
        dom.className = 'prompt-template-node prompt-template-selected'
      } else {
        dom.className = 'prompt-template-node prompt-template-parameter'
      }
    }
    
    if (prevNode.__data.parameterName !== this.__data.parameterName) {
      dom.setAttribute('data-parameter-name', this.__data.parameterName)
    }
    
    if (prevNode.__data.type !== this.__data.type) {
      dom.setAttribute('data-template-type', this.__data.type)
    }
    
    if (prevNode.__data.selectedValue !== this.__data.selectedValue) {
      if (this.__data.selectedValue) {
        dom.setAttribute('data-selected-value', this.__data.selectedValue)
      } else {
        dom.removeAttribute('data-selected-value')
      }
    }
    
    return isUpdated
  }

  static importJSON(serializedNode: SerializedPromptTemplateNode): PromptTemplateNode {
    const { data, text } = serializedNode
    const node = $createPromptTemplateNode(data)
    node.setTextContent(text)
    node.setFormat(serializedNode.format)
    return node
  }

  exportJSON(): SerializedPromptTemplateNode {
    return {
      ...super.exportJSON(),
      data: this.__data,
      type: 'prompt-template',
      version: 1,
    }
  }

  // 获取模板数据
  getTemplateData(): PromptTemplateData {
    return this.__data
  }

  // 更新模板数据
  setTemplateData(data: PromptTemplateData): void {
    const writable = this.getWritable()
    writable.__data = data
    
    // 更新显示文本
    if (data.selectedValue) {
      writable.__text = data.selectedValue
    } else {
      writable.__text = PromptTemplateNode.getWrappedText(data.parameterName, data.type)
    }
  }

  // 设置选中的值
  setSelectedValue(value: string): void {
    const writable = this.getWritable()
    writable.__data = {
      ...this.__data,
      selectedValue: value,
      isSelected: true
    }
    writable.__text = value
  }

  // 清除选中的值
  clearSelectedValue(): void {
    const writable = this.getWritable()
    writable.__data = {
      ...this.__data,
      selectedValue: undefined,
      isSelected: false
    }
    writable.__text = PromptTemplateNode.getWrappedText(this.__data.parameterName, this.__data.type)
  }

  // 允许在节点前后插入文本
  canInsertTextBefore(): boolean {
    return true
  }

  canInsertTextAfter(): boolean {
    return true
  }

  isTextEntity(): boolean {
    return true
  }
}

// 创建 PromptTemplateNode 的工厂函数
export function $createPromptTemplateNode(data: PromptTemplateData): PromptTemplateNode {
  const promptTemplateNode = new PromptTemplateNode(data)
  return $applyNodeReplacement(promptTemplateNode)
}

// 类型守卫函数
export function $isPromptTemplateNode(
  node: LexicalNode | null | undefined,
): node is PromptTemplateNode {
  return node instanceof PromptTemplateNode
}