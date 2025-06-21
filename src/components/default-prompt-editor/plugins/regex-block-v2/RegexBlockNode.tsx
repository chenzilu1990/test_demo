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

export type RegexBlockType = 'square' | 'curly' | 'double-curly'

export type RegexBlockData = {
  id: string
  content: string
  type: RegexBlockType
  description?: string
  category?: string
}

export type SerializedRegexBlockNode = Spread<{
  data: RegexBlockData
  type: 'regex-block'
  version: 1
}, SerializedTextNode>

export class RegexBlockNode extends TextNode {
  __data: RegexBlockData

  static getType(): string {
    return 'regex-block'
  }

  static clone(node: RegexBlockNode): RegexBlockNode {
    return new RegexBlockNode(node.__data, node.__text, node.__key)
  }

  constructor(data: RegexBlockData, text?: string, key?: NodeKey) {
    // 使用相应的包裹符号包装内容
    const wrappedText = text || RegexBlockNode.getWrappedText(data.content, data.type)
    super(wrappedText, key)
    this.__data = data
  }

  // 根据类型获取包装后的文本
  static getWrappedText(content: string, type: RegexBlockType): string {
    switch (type) {
      case 'square':
        return `[${content}]`
      case 'curly':
        return `{${content}}`
      case 'double-curly':
        return `{{${content}}}`
      default:
        return content
    }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config)
    element.className = 'regex-block-node'
    element.setAttribute('data-regex-id', this.__data.id)
    element.setAttribute('data-regex-type', this.__data.type)
    element.setAttribute('data-regex-content', this.__data.content)
    
    // 添加点击事件处理
    element.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      
      // 触发自定义事件，通知需要显示菜单
      const customEvent = new CustomEvent('regex-block-click', {
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
    prevNode: RegexBlockNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    const isUpdated = super.updateDOM(prevNode as this, dom, config)
    
    if (prevNode.__data.id !== this.__data.id) {
      dom.setAttribute('data-regex-id', this.__data.id)
    }
    
    if (prevNode.__data.type !== this.__data.type) {
      dom.setAttribute('data-regex-type', this.__data.type)
    }
    
    if (prevNode.__data.content !== this.__data.content) {
      dom.setAttribute('data-regex-content', this.__data.content)
    }
    
    return isUpdated
  }

  static importJSON(serializedNode: SerializedRegexBlockNode): RegexBlockNode {
    const { data, text } = serializedNode
    const node = $createRegexBlockNode(data)
    node.setTextContent(text)
    node.setFormat(serializedNode.format)
    return node
  }

  exportJSON(): SerializedRegexBlockNode {
    return {
      ...super.exportJSON(),
      data: this.__data,
      type: 'regex-block',
      version: 1,
    }
  }

  // 获取 regex block 数据
  getRegexBlockData(): RegexBlockData {
    return this.__data
  }

  // 更新 regex block 数据
  setRegexBlockData(data: RegexBlockData): void {
    const writable = this.getWritable()
    writable.__data = data
    writable.__text = RegexBlockNode.getWrappedText(data.content, data.type)
  }

  // 允许在节点前后插入文本（这样可以正常删除）
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

// 创建 RegexBlockNode 的工厂函数
export function $createRegexBlockNode(data: RegexBlockData): RegexBlockNode {
  const regexBlockNode = new RegexBlockNode(data)
  return $applyNodeReplacement(regexBlockNode)
}

// 类型守卫函数
export function $isRegexBlockNode(
  node: LexicalNode | null | undefined,
): node is RegexBlockNode {
  return node instanceof RegexBlockNode
}