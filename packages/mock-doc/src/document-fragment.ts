import { NODE_NAMES, NODE_TYPES } from './constants';
import { MockCSSStyleSheet } from './css-style-sheet';
import { getElementById } from './document';
import { MockElement, MockHTMLElement } from './node';

export class MockDocumentFragment extends MockHTMLElement {
  constructor(ownerDocument: any) {
    super(ownerDocument, null);
    this.nodeName = NODE_NAMES.DOCUMENT_FRAGMENT_NODE;
    this.nodeType = NODE_TYPES.DOCUMENT_FRAGMENT_NODE;
  }

  getElementById(id: string): MockElement {
    return getElementById(this, id);
  }

  get adoptedStyleSheets(): MockCSSStyleSheet[] {
    return [];
  }

  set adoptedStyleSheets(_adoptedStyleSheets: MockCSSStyleSheet[]) {
    throw new Error('Unimplemented');
  }

  override cloneNode(deep?: boolean) {
    const cloned = new MockDocumentFragment(null);

    if (deep) {
      for (let i = 0, ii = this.childNodes.length; i < ii; i++) {
        const childNode = this.childNodes[i];
        if (
          childNode.nodeType === NODE_TYPES.ELEMENT_NODE ||
          childNode.nodeType === NODE_TYPES.TEXT_NODE ||
          childNode.nodeType === NODE_TYPES.COMMENT_NODE
        ) {
          const clonedChildNode = this.childNodes[i].cloneNode(true);
          cloned.appendChild(clonedChildNode);
        }
      }
    }

    return cloned;
  }
}
