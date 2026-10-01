import type { MockElement } from './node';

/**
 * NodeFilter constants for use in Node.js environment.
 */
const FILTER_ACCEPT = 1;
const FILTER_SKIP = 3;

/**
 * A minimal TreeWalker implementation for dom-selector compatibility.
 */
export class MockTreeWalker implements TreeWalker {
  root: Node;
  whatToShow: number;
  filter: NodeFilter | null;
  currentNode: Node;

  constructor(root: MockElement, whatToShow: number, filter: NodeFilter | null) {
    this.root = root as unknown as Node;
    this.whatToShow = whatToShow;
    this.filter = filter;
    this.currentNode = root as unknown as Node;
  }

  private acceptNode(node: Node): number {
    // Check whatToShow
    const nodeType = node.nodeType;
    const mask = 1 << (nodeType - 1);
    if (!(this.whatToShow & mask)) {
      return FILTER_SKIP;
    }

    // Check filter
    if (this.filter) {
      if (typeof this.filter === 'function') {
        return (this.filter as unknown as (node: Node) => number)(node);
      }
      return this.filter.acceptNode(node);
    }

    return FILTER_ACCEPT;
  }

  parentNode(): Node | null {
    let node = this.currentNode;
    while (node && node !== this.root) {
      node = node.parentNode as Node;
      if (node && this.acceptNode(node) === FILTER_ACCEPT) {
        this.currentNode = node;
        return node;
      }
    }
    return null;
  }

  firstChild(): Node | null {
    return this.traverseChildren('first');
  }

  lastChild(): Node | null {
    return this.traverseChildren('last');
  }

  nextSibling(): Node | null {
    return this.traverseSiblings('next');
  }

  previousSibling(): Node | null {
    return this.traverseSiblings('previous');
  }

  nextNode(): Node | null {
    let node: Node | null = this.currentNode;
    let result: number;

    while (node) {
      // Try first child
      if (node.firstChild) {
        node = node.firstChild;
        result = this.acceptNode(node);
        if (result === FILTER_ACCEPT) {
          this.currentNode = node;
          return node;
        }
        continue;
      }

      // Try siblings and ancestors' siblings
      while (node) {
        if (node === this.root) {
          return null;
        }
        if (node.nextSibling) {
          node = node.nextSibling;
          result = this.acceptNode(node);
          if (result === FILTER_ACCEPT) {
            this.currentNode = node;
            return node;
          }
          break;
        }
        node = node.parentNode as Node;
      }
    }
    return null;
  }

  previousNode(): Node | null {
    let node: Node | null = this.currentNode;
    while (node && node !== this.root) {
      if (node.previousSibling) {
        node = node.previousSibling;
        // Go to last descendant
        while (node.lastChild) {
          node = node.lastChild;
        }
        if (this.acceptNode(node) === FILTER_ACCEPT) {
          this.currentNode = node;
          return node;
        }
      } else {
        node = node.parentNode as Node;
        if (node && node !== this.root && this.acceptNode(node) === FILTER_ACCEPT) {
          this.currentNode = node;
          return node;
        }
      }
    }
    return null;
  }

  private traverseChildren(type: 'first' | 'last'): Node | null {
    let node: Node | null =
      type === 'first' ? this.currentNode.firstChild : this.currentNode.lastChild;
    while (node) {
      const result = this.acceptNode(node);
      if (result === FILTER_ACCEPT) {
        this.currentNode = node;
        return node;
      }
      if (result === FILTER_SKIP) {
        const child = type === 'first' ? node.firstChild : node.lastChild;
        if (child) {
          node = child;
          continue;
        }
      }
      node = type === 'first' ? node.nextSibling : node.previousSibling;
    }
    return null;
  }

  private traverseSiblings(type: 'next' | 'previous'): Node | null {
    let node: Node | null = this.currentNode;
    while (node && node !== this.root) {
      const sibling = type === 'next' ? node.nextSibling : node.previousSibling;
      if (sibling) {
        node = sibling;
        const result = this.acceptNode(node);
        if (result === FILTER_ACCEPT) {
          this.currentNode = node;
          return node;
        }
        if (result === FILTER_SKIP) {
          const child = type === 'next' ? node.firstChild : node.lastChild;
          if (child) {
            node = child;
            continue;
          }
        }
        continue;
      }
      node = node.parentNode as Node;
    }
    return null;
  }
}
