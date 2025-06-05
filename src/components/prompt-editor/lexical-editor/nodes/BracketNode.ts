import {
  NodeKey,
  TextNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  SerializedTextNode,
  LexicalNode,
  DOMExportOutput,
  EditorConfig,
} from 'lexical';

export interface SerializedBracketNode extends SerializedTextNode {
  bracketType: string;
  options?: string[];
}

export class BracketNode extends TextNode {
  __bracketType: string;
  __options?: string[];

  static getType(): string {
    return 'bracket';
  }

  static clone(node: BracketNode): BracketNode {
    return new BracketNode(
      node.__text,
      node.__bracketType,
      node.__options,
      node.__key
    );
  }

  constructor(
    text: string,
    bracketType: string,
    options?: string[],
    key?: NodeKey
  ) {
    super(text, key);
    this.__bracketType = bracketType;
    this.__options = options;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.style.color = '#3b82f6'; // blue-500
    element.style.backgroundColor = '#dbeafe'; // blue-100
    element.style.padding = '2px 4px';
    element.style.borderRadius = '4px';
    element.style.cursor = 'pointer';
    element.style.display = 'inline-block';
    element.style.userSelect = 'none';
    element.style.outline = 'none';
    element.classList.add('bracket-node');
    element.setAttribute('data-bracket-type', this.__bracketType);
    if (this.__options && this.__options.length > 0) {
      element.setAttribute('data-bracket-options', JSON.stringify(this.__options));
    }
    element.setAttribute('tabindex', '0'); // 使节点可以获得焦点
    
    // 添加hover效果
    element.addEventListener('mouseenter', () => {
      element.style.backgroundColor = '#bfdbfe'; // blue-200
    });
    element.addEventListener('mouseleave', () => {
      element.style.backgroundColor = '#dbeafe'; // blue-100
    });
    
    // 添加焦点样式
    element.addEventListener('focus', () => {
      element.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
    });
    element.addEventListener('blur', () => {
      element.style.boxShadow = 'none';
    });
    
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedBracketNode): BracketNode {
    const { text, bracketType, options } = serializedNode;
    const node = $createBracketNode(text, bracketType, options);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON(): SerializedBracketNode {
    return {
      ...super.exportJSON(),
      bracketType: this.__bracketType,
      options: this.__options,
      type: 'bracket',
      version: 1,
    };
  }

  getBracketType(): string {
    return this.__bracketType;
  }

  getOptions(): string[] | undefined {
    return this.__options;
  }
}

export function $createBracketNode(
  text: string,
  bracketType: string,
  options?: string[]
): BracketNode {
  return new BracketNode(text, bracketType, options);
}

export function $isBracketNode(
  node: LexicalNode | null | undefined
): node is BracketNode {
  return node instanceof BracketNode;
}
