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

export type MentionNodeData = {
  id: string
  name: string
  avatar?: string
  email?: string
  type?: 'user' | 'team' | 'role'
}

export type SerializedMentionNode = Spread<{
  data: MentionNodeData
  type: 'mention'
  version: 1
}, SerializedTextNode>

export class MentionNode extends TextNode {
  __data: MentionNodeData

  static getType(): string {
    return 'mention'
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__data, node.__text, node.__key)
  }

  constructor(data: MentionNodeData, text?: string, key?: NodeKey) {
    // 使用 @ + 名称作为文本内容
    super(text || `@${data.name}`, key)
    this.__data = data
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config)
    element.className = 'mention-node'
    element.setAttribute('data-mention-id', this.__data.id)
    element.setAttribute('data-mention-type', this.__data.type || 'user')
    
    // 添加点击事件处理
    element.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      
      // 触发自定义事件，通知需要显示菜单
      const customEvent = new CustomEvent('mention-node-click', {
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
    prevNode: MentionNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config)
    
    if (prevNode.__data.id !== this.__data.id) {
      dom.setAttribute('data-mention-id', this.__data.id)
    }
    
    if (prevNode.__data.type !== this.__data.type) {
      dom.setAttribute('data-mention-type', this.__data.type || 'user')
    }
    
    return isUpdated
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    const { data, text } = serializedNode
    const node = $createMentionNode(data)
    node.setTextContent(text)
    node.setFormat(serializedNode.format)
    return node
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      data: this.__data,
      type: 'mention',
      version: 1,
    }
  }

  // 获取 mention 数据
  getMentionData(): MentionNodeData {
    return this.__data
  }

  // 更新 mention 数据
  setMentionData(data: MentionNodeData): void {
    const writable = this.getWritable()
    writable.__data = data
    writable.__text = `@${data.name}`
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

// 创建 MentionNode 的工厂函数
export function $createMentionNode(data: MentionNodeData): MentionNode {
  const mentionNode = new MentionNode(data)
  return $applyNodeReplacement(mentionNode)
}

// 类型守卫函数
export function $isMentionNode(
  node: LexicalNode | null | undefined,
): node is MentionNode {
  return node instanceof MentionNode
}