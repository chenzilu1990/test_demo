import {
  NodeKey,
  TextNode,
  SerializedTextNode,
  LexicalNode,
  EditorConfig,
} from 'lexical';

export interface SerializedSelectedValueNode extends SerializedTextNode {
  originalBracket: string;
  valueType: string;
}

export class SelectedValueNode extends TextNode {
  __originalBracket: string;
  __valueType: string;

  static getType(): string {
    return 'selected-value';
  }

  static clone(node: SelectedValueNode): SelectedValueNode {
    return new SelectedValueNode(
      node.__text,
      node.__originalBracket,
      node.__valueType,
      node.__key
    );
  }

  constructor(
    text: string,
    originalBracket: string,
    valueType: string,
    key?: NodeKey
  ) {
    super(text, key);
    this.__originalBracket = originalBracket;
    this.__valueType = valueType;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.style.backgroundColor = '#dcfce7'; // green-100
    element.style.color = '#166534'; // green-800
    element.style.padding = '2px 4px';
    element.style.borderRadius = '4px';
    element.style.cursor = 'pointer';
    element.style.display = 'inline-block';
    element.style.userSelect = 'none';
    element.style.outline = 'none';
    element.classList.add('selected-value-node');
    element.setAttribute('data-value-type', this.__valueType);
    element.setAttribute('data-original-bracket', this.__originalBracket);
    element.setAttribute('tabindex', '0'); // 使节点可以获得焦点
    element.title = `点击重新选择${this.__valueType}`;
    
    // 添加hover效果
    element.addEventListener('mouseenter', () => {
      element.style.backgroundColor = '#bbf7d0'; // green-200
    });
    element.addEventListener('mouseleave', () => {
      element.style.backgroundColor = '#dcfce7'; // green-100
    });
    
    // 添加焦点样式
    element.addEventListener('focus', () => {
      element.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.5)';
    });
    element.addEventListener('blur', () => {
      element.style.boxShadow = 'none';
    });
    
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedSelectedValueNode): SelectedValueNode {
    const { text, originalBracket, valueType } = serializedNode;
    const node = $createSelectedValueNode(text, originalBracket, valueType);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON(): SerializedSelectedValueNode {
    return {
      ...super.exportJSON(),
      originalBracket: this.__originalBracket,
      valueType: this.__valueType,
      type: 'selected-value',
      version: 1,
    };
  }

  getOriginalBracket(): string {
    return this.__originalBracket;
  }

  getValueType(): string {
    return this.__valueType;
  }
}

export function $createSelectedValueNode(
  text: string,
  originalBracket: string,
  valueType: string
): SelectedValueNode {
  return new SelectedValueNode(text, originalBracket, valueType);
}

export function $isSelectedValueNode(
  node: LexicalNode | null | undefined
): node is SelectedValueNode {
  return node instanceof SelectedValueNode;
}
