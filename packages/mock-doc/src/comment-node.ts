import { NODE_NAMES, NODE_TYPES } from './constants';
import { MockNode } from './node';

export class MockComment extends MockNode {
  constructor(ownerDocument: any, data: string) {
    super(ownerDocument, NODE_TYPES.COMMENT_NODE, NODE_NAMES.COMMENT_NODE, data);
  }

  override cloneNode(_deep?: boolean) {
    return new MockComment(null, this.nodeValue);
  }

  override get textContent() {
    return this.nodeValue;
  }

  override set textContent(text) {
    this.nodeValue = text;
  }
}
