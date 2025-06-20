import type { EditorConfig, LexicalNode, NodeKey, SerializedTextNode } from 'lexical'
import { TextNode } from 'lexical'

export type SerializedRegexNode = SerializedTextNode & {
  regex: string
  isValid: boolean
}

export class RegexNode extends TextNode {
  __regex: string
  __isValid: boolean

  static getType(): string {
    return 'regex'
  }

  static clone(node: RegexNode): RegexNode {
    return new RegexNode(node.__text, node.__regex, node.__isValid, node.__key)
  }

  constructor(text: string, regex: string, isValid: boolean = true, key?: NodeKey) {
    super(text, key)
    this.__regex = regex
    this.__isValid = isValid
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config)
    dom.classList.add('regex-node')
    if (this.__isValid) {
      dom.classList.add('regex-valid')
    } else {
      dom.classList.add('regex-invalid')
    }
    dom.setAttribute('data-regex', this.__regex)
    dom.title = `正则表达式: ${this.__regex}`
    return dom
  }

  updateDOM(prevNode: RegexNode, dom: HTMLElement, config: EditorConfig): boolean {
    const updated = super.updateDOM(prevNode, dom, config)
    
    if (prevNode.__regex !== this.__regex || prevNode.__isValid !== this.__isValid) {
      dom.classList.toggle('regex-valid', this.__isValid)
      dom.classList.toggle('regex-invalid', !this.__isValid)
      dom.setAttribute('data-regex', this.__regex)
      dom.title = `正则表达式: ${this.__regex}`
      return true
    }
    
    return updated
  }

  static importJSON(serializedNode: SerializedRegexNode): RegexNode {
    const node = new RegexNode(
      serializedNode.text,
      serializedNode.regex,
      serializedNode.isValid
    )
    node.setFormat(serializedNode.format)
    node.setDetail(serializedNode.detail)
    node.setMode(serializedNode.mode)
    node.setStyle(serializedNode.style)
    return node
  }

  exportJSON(): SerializedRegexNode {
    return {
      ...super.exportJSON(),
      type: 'regex',
      regex: this.__regex,
      isValid: this.__isValid,
    }
  }

  getRegex(): string {
    return this.__regex
  }

  isValid(): boolean {
    return this.__isValid
  }

  setRegex(regex: string): void {
    const writable = this.getWritable()
    writable.__regex = regex
    
    // 验证正则表达式
    try {
      new RegExp(regex)
      writable.__isValid = true
    } catch {
      writable.__isValid = false
    }
  }

  setValid(isValid: boolean): void {
    const writable = this.getWritable()
    writable.__isValid = isValid
  }

  isSimpleText(): boolean {
    return false
  }

  canInsertTextBefore(): boolean {
    return false
  }

  canInsertTextAfter(): boolean {
    return false
  }
}

export function $createRegexNode(text: string, regex: string, isValid: boolean = true): RegexNode {
  return new RegexNode(text, regex, isValid)
}

export function $isRegexNode(node: LexicalNode | null | undefined): node is RegexNode {
  return node instanceof RegexNode
} 