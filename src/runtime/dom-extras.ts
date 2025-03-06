import { BUILD } from '@app-data';
import { supportsShadow } from '@platform';

import type * as d from '../declarations';
import {
  addSlotRelocateNode,
  dispatchSlotChangeEvent,
  findSlotFromSlottedNode,
  getHostSlotNodes,
  getSlotChildSiblings,
  getSlotName,
  getSlottedChildNodes,
  updateFallbackSlotVisibility,
} from './slot-polyfill-utils';

/// HOST ELEMENTS ///

export const patchPseudoShadowDom = (hostElementPrototype: HTMLElement) => {
  patchCloneNode(hostElementPrototype);
  patchSlotAppendChild(hostElementPrototype);
  patchSlotAppend(hostElementPrototype);
  patchSlotPrepend(hostElementPrototype);
  patchSlotInsertAdjacentElement(hostElementPrototype);
  patchSlotInsertAdjacentHTML(hostElementPrototype);
  patchSlotInsertAdjacentText(hostElementPrototype);
  patchInsertBefore(hostElementPrototype);
  patchTextContent(hostElementPrototype);
  patchChildSlotNodes(hostElementPrototype);
  patchSlotRemoveChild(hostElementPrototype);
};

/**
 * Patches the `cloneNode` method on a `scoped` Stencil component.
 *
 * @param HostElementPrototype The Stencil component to be patched
 */
export const patchCloneNode = (HostElementPrototype: HTMLElement) => {
  const orgCloneNode = HostElementPrototype.cloneNode;

  HostElementPrototype.cloneNode = function (deep?: boolean) {
    const srcNode = this;
    const isShadowDom = BUILD.shadowDom ? srcNode.shadowRoot && supportsShadow : false;
    const clonedNode = orgCloneNode.call(srcNode, isShadowDom ? deep : false) as Node;
    if (BUILD.slot && !isShadowDom && deep) {
      let i = 0;
      let slotted, nonStencilNode;
      const stencilPrivates = [
        's-id',
        's-cr',
        's-lr',
        's-rc',
        's-sc',
        's-p',
        's-cn',
        's-sr',
        's-sn',
        's-hn',
        's-ol',
        's-nr',
        's-si',
        's-rf',
        's-scs',
      ];
      const childNodes = (this as any).__childNodes || this.childNodes;

      for (; i < childNodes.length; i++) {
        slotted = (childNodes[i] as any)['s-nr'];
        nonStencilNode = stencilPrivates.every((privateField) => !(childNodes[i] as any)[privateField]);
        if (slotted) {
          if (BUILD.appendChildSlotFix && (clonedNode as any).__appendChild) {
            (clonedNode as any).__appendChild(slotted.cloneNode(true));
          } else {
            clonedNode.appendChild(slotted.cloneNode(true));
          }
        }
        if (nonStencilNode) {
          clonedNode.appendChild((childNodes[i] as any).cloneNode(true));
        }
      }
    }
    return clonedNode;
  };
};

/**
 * Patches the `appendChild` method on a `scoped` Stencil component.
 * The patch will attempt to find a slot with the same name as the node being appended
 * and insert it into the slot reference if found. Otherwise, it falls-back to the original
 * `appendChild` method.
 *
 * @param HostElementPrototype The Stencil component to be patched
 */
export const patchSlotAppendChild = (HostElementPrototype: any) => {
  HostElementPrototype.__appendChild = HostElementPrototype.appendChild;

  HostElementPrototype.appendChild = function (this: d.RenderNode, newChild: d.RenderNode) {
    const { slotName, slotNode } = findSlotFromSlottedNode(newChild, this);
    if (slotNode) {
      addSlotRelocateNode(newChild, slotNode);

      const slotChildNodes = getSlotChildSiblings(slotNode, slotName);
      const appendAfter = slotChildNodes[slotChildNodes.length - 1];

      const parent = internalCall(appendAfter, 'parentNode') as d.RenderNode;
      const insertedNode: d.RenderNode = internalCall(parent, 'insertBefore')(newChild, appendAfter.nextSibling);
      dispatchSlotChangeEvent(slotNode);

      // Check if there is fallback content that should be hidden
      updateFallbackSlotVisibility(this);

      return insertedNode;
    }
    return (this as any).__appendChild(newChild);
  };
};

/**
 * Patches the `removeChild` method on a `scoped` Stencil component.
 * This patch attempts to remove the specified node from a slot reference
 * if the slot exists. Otherwise, it falls-back to the original `removeChild` method.
 *
 * @param ElementPrototype The Stencil component to be patched
 */
const patchSlotRemoveChild = (ElementPrototype: any) => {
  ElementPrototype.__removeChild = ElementPrototype.removeChild;

  ElementPrototype.removeChild = function (this: d.RenderNode, toRemove: d.RenderNode) {
    if (toRemove && typeof toRemove['s-sn'] !== 'undefined') {
      const childNodes = (this as any).__childNodes || this.childNodes;
      const slotNode = getHostSlotNodes(childNodes, this.tagName, toRemove['s-sn']);
      if (slotNode && toRemove.isConnected) {
        toRemove.remove();
        // Check if there is fallback content that should be displayed if that
        // was the last node in the slot
        updateFallbackSlotVisibility(this);
        return;
      }
    }
    return (this as any).__removeChild(toRemove);
  };
};

/**
 * Patches the `prepend` method for a slotted node inside a scoped component.
 *
 * @param HostElementPrototype the `Element` to be patched
 */
export const patchSlotPrepend = (HostElementPrototype: HTMLElement) => {
  (HostElementPrototype as any).__prepend = HostElementPrototype.prepend;

  HostElementPrototype.prepend = function (this: d.HostElement, ...newChildren: (d.RenderNode | string)[]) {
    newChildren.forEach((newChild: d.RenderNode | string) => {
      if (typeof newChild === 'string') {
        newChild = this.ownerDocument.createTextNode(newChild) as unknown as d.RenderNode;
      }
      const slotName = (newChild['s-sn'] = getSlotName(newChild)) || '';
      const childNodes = internalCall(this, 'childNodes');
      const slotNode = getHostSlotNodes(childNodes, this.tagName, slotName)[0];
      if (slotNode) {
        addSlotRelocateNode(newChild, slotNode, true);
        const slotChildNodes = getSlotChildSiblings(slotNode, slotName);
        const appendAfter = slotChildNodes[0];

        const parent = internalCall(appendAfter, 'parentNode') as d.RenderNode;
        const toReturn = internalCall(parent, 'insertBefore')(newChild, internalCall(appendAfter, 'nextSibling'));
        dispatchSlotChangeEvent(slotNode);
        return toReturn;
      }

      if (newChild.nodeType === 1 && !!newChild.getAttribute('slot')) {
        newChild.hidden = true;
      }

      return (HostElementPrototype as any).__prepend(newChild);
    });
  };
};

/**
 * Patches the `append` method for a slotted node inside a scoped component. The patched method uses
 * `appendChild` under-the-hood while creating text nodes for any new children that passed as bare strings.
 *
 * @param HostElementPrototype the `Element` to be patched
 */
export const patchSlotAppend = (HostElementPrototype: HTMLElement) => {
  (HostElementPrototype as any).__append = HostElementPrototype.append;
  HostElementPrototype.append = function (this: d.HostElement, ...newChildren: (d.RenderNode | string)[]) {
    newChildren.forEach((newChild: d.RenderNode | string) => {
      if (typeof newChild === 'string') {
        newChild = this.ownerDocument.createTextNode(newChild) as unknown as d.RenderNode;
      }
      this.appendChild(newChild);
    });
  };
};

/**
 * Patches the `insertAdjacentHTML` method for a slotted node inside a scoped component. Specifically,
 * we only need to patch the behavior for the specific `beforeend` and `afterbegin` positions so the element
 * gets inserted into the DOM in the correct location.
 *
 * @param HostElementPrototype the `Element` to be patched
 */
export const patchSlotInsertAdjacentHTML = (HostElementPrototype: HTMLElement) => {
  const originalInsertAdjacentHtml = HostElementPrototype.insertAdjacentHTML;

  HostElementPrototype.insertAdjacentHTML = function (this: d.HostElement, position: InsertPosition, text: string) {
    if (position !== 'afterbegin' && position !== 'beforeend') {
      return originalInsertAdjacentHtml.call(this, position, text);
    }
    const container = this.ownerDocument.createElement('_');
    let node: d.RenderNode;
    container.innerHTML = text;

    if (position === 'afterbegin') {
      while ((node = container.firstChild as d.RenderNode)) {
        this.prepend(node);
      }
    } else if (position === 'beforeend') {
      while ((node = container.firstChild as d.RenderNode)) {
        this.append(node);
      }
    }
  };
};

/**
 * Patches the `insertAdjacentText` method for a slotted node inside a scoped component. Specifically,
 * we only need to patch the behavior for the specific `beforeend` and `afterbegin` positions so the text node
 * gets inserted into the DOM in the correct location.
 *
 * @param HostElementPrototype the `Element` to be patched
 */
export const patchSlotInsertAdjacentText = (HostElementPrototype: HTMLElement) => {
  HostElementPrototype.insertAdjacentText = function (this: d.HostElement, position: InsertPosition, text: string) {
    this.insertAdjacentHTML(position, text);
  };
};

/**
 * Patches the `insertBefore` of a non-shadow component.
 *
 * The *current* node to insert before may not be in the root of our component
 * (e.g. if it's 'slotted' it appears in the root, but isn't really)
 *
 * This tries to find where the *current* node lives within the component and insert the new node before it
 * *If* the new node is in the same slot as the *current* node. Otherwise the new node is appended to it's 'slot'
 *
 * @param HostElementPrototype the custom element prototype to patch
 */
const patchInsertBefore = (HostElementPrototype: HTMLElement) => {
  const eleProto: d.RenderNode = HostElementPrototype;
  if (eleProto.__insertBefore) return;

  eleProto.__insertBefore = HostElementPrototype.insertBefore;

  HostElementPrototype.insertBefore = function <T extends d.PatchedSlotNode>(
    this: d.RenderNode,
    newChild: T,
    currentChild: d.RenderNode | null,
  ) {
    const { slotName, slotNode } = findSlotFromSlottedNode(newChild, this);
    const slottedNodes = this.__childNodes ? this.childNodes : getSlottedChildNodes(this.childNodes);

    if (slotNode) {
      let found = false;

      slottedNodes.forEach((childNode) => {
        if (childNode === currentChild || currentChild === null) {
          // we found the node to insert before in our list of 'lightDOM' / slotted nodes
          found = true;

          if (currentChild === null || slotName !== currentChild['s-sn']) {
            // new child is not in the same slot as 'slot before' node
            // so let's use the patched appendChild method. This will correctly slot the node
            this.appendChild(newChild);
            return;
          }

          if (slotName === currentChild['s-sn']) {
            // current child ('slot before' node) is 'in' the same slot
            addSlotRelocateNode(newChild, slotNode);

            const parent = internalCall(currentChild, 'parentNode') as d.RenderNode;
            internalCall(parent, 'insertBefore')(newChild, currentChild);

            dispatchSlotChangeEvent(slotNode);
          }
          return;
        }
      });
      if (found) return newChild;
    }

    /**
     * Fixes an issue where slotted elements are dynamically relocated in React, such as after data fetch.
     *
     * When a slotted element is passed to another scoped component (e.g., <A><C slot="header"/></A>),
     * the child’s __parentNode (original parent node property) does not match this.
     *
     * To prevent errors, this checks if the current child's parent node differs from this.
     * If so, appendChild(newChild) is called to ensure the child is correctly inserted,
     * allowing Stencil to properly manage the slot placement.
     */
    const parentNode = (currentChild as d.PatchedSlotNode)?.__parentNode;
    if (parentNode && !this.isSameNode(parentNode)) {
      return this.appendChild(newChild);
    }
    return (this as d.RenderNode).__insertBefore(newChild, currentChild);
  };
};

/**
 * Patches the `insertAdjacentElement` method for a slotted node inside a scoped component. Specifically,
 * we only need to patch the behavior for the specific `beforeend` and `afterbegin` positions so the element
 * gets inserted into the DOM in the correct location.
 *
 * @param HostElementPrototype the `Element` to be patched
 */
export const patchSlotInsertAdjacentElement = (HostElementPrototype: HTMLElement) => {
  const originalInsertAdjacentElement = HostElementPrototype.insertAdjacentElement;

  HostElementPrototype.insertAdjacentElement = function (
    this: d.HostElement,
    position: InsertPosition,
    element: d.RenderNode,
  ): Element {
    if (position !== 'afterbegin' && position !== 'beforeend') {
      return originalInsertAdjacentElement.call(this, position, element);
    }
    if (position === 'afterbegin') {
      this.prepend(element);
      return element;
    } else if (position === 'beforeend') {
      this.append(element);
      return element;
    }
    return element;
  };
};

/**
 * Patches the `textContent` of an unnamed slotted node inside a scoped component
 *
 * @param hostElementPrototype the `Element` to be patched
 */
export const patchTextContent = (hostElementPrototype: HTMLElement): void => {
  patchHostOriginalAccessor('textContent', hostElementPrototype);

  Object.defineProperty(hostElementPrototype, 'textContent', {
    get: function () {
      let text = '';
      const childNodes = this.__childNodes ? this.childNodes : getSlottedChildNodes(this.childNodes);
      childNodes.forEach((node: d.RenderNode) => (text += node.textContent || ''));
      return text;
    },
    set: function (value) {
      const childNodes = this.__childNodes ? this.childNodes : getSlottedChildNodes(this.childNodes);
      childNodes.forEach((node: d.RenderNode) => {
        if (node['s-ol']) node['s-ol'].remove();
        node.remove();
      });
      this.insertAdjacentHTML('beforeend', value);
    },
  });
};

export const patchChildSlotNodes = (elm: HTMLElement) => {
  class FakeNodeList extends Array {
    item(n: number) {
      return this[n];
    }
  }

  patchHostOriginalAccessor('children', elm);
  Object.defineProperty(elm, 'children', {
    get() {
      return this.childNodes.filter((n: any) => n.nodeType === 1);
    },
  });

  Object.defineProperty(elm, 'childElementCount', {
    get() {
      return this.children.length;
    },
  });

  patchHostOriginalAccessor('firstChild', elm);
  Object.defineProperty(elm, 'firstChild', {
    get() {
      return this.childNodes[0];
    },
  });

  patchHostOriginalAccessor('lastChild', elm);
  Object.defineProperty(elm, 'lastChild', {
    get() {
      return this.childNodes[this.childNodes.length - 1];
    },
  });

  patchHostOriginalAccessor('childNodes', elm);
  Object.defineProperty(elm, 'childNodes', {
    get() {
      const result = new FakeNodeList();
      result.push(...getSlottedChildNodes(this.__childNodes));
      return result;
    },
  });
};

/// SLOTTED NODES ///

/**
 * Patches sibling accessors of a 'slotted' node within a non-shadow component.
 * Meaning whilst stepping through a non-shadow element's nodes, only the mock 'lightDOM' nodes are returned.
 * Especially relevant when rendering components via SSR... Frameworks will often try to reconcile their
 * VDOM with the real DOM by stepping through nodes with 'nextSibling' et al.
 * - `nextSibling`
 * - `nextElementSibling`
 * - `previousSibling`
 * - `previousElementSibling`
 *
 * @param node the slotted node to be patched
 */
export const patchSlottedNode = (node: Node) => {
  if (!node || (node as any).__nextSibling !== undefined || !globalThis.Node) return;

  patchNextSibling(node);
  patchPreviousSibling(node);
  patchParentNode(node);

  if (node.nodeType === Node.ELEMENT_NODE) {
    patchNextElementSibling(node as Element);
    patchPreviousElementSibling(node as Element);
  }
};

/**
 * Patches the `nextSibling` accessor of a non-shadow slotted node
 *
 * @param node the slotted node to be patched
 */
const patchNextSibling = (node: Node) => {
  // already been patched? return
  if (!node || (node as any).__nextSibling) return;

  patchHostOriginalAccessor('nextSibling', node);
  Object.defineProperty(node, 'nextSibling', {
    get: function () {
      const parentNodes = this['s-ol']?.parentNode.childNodes;
      const index = parentNodes?.indexOf(this);
      if (parentNodes && index > -1) {
        return parentNodes[index + 1];
      }
      return this.__nextSibling;
    },
  });
};

/**
 * Patches the `nextElementSibling` accessor of a non-shadow slotted node
 *
 * @param element the slotted element node to be patched
 */
const patchNextElementSibling = (element: Element) => {
  if (!element || (element as any).__nextElementSibling) return;

  patchHostOriginalAccessor('nextElementSibling', element);
  Object.defineProperty(element, 'nextElementSibling', {
    get: function () {
      const parentEles = this['s-ol']?.parentNode.children;
      const index = parentEles?.indexOf(this);
      if (parentEles && index > -1) {
        return parentEles[index + 1];
      }
      return this.__nextElementSibling;
    },
  });
};

/**
 * Patches the `previousSibling` accessor of a non-shadow slotted node
 *
 * @param node the slotted node to be patched
 */
const patchPreviousSibling = (node: Node) => {
  if (!node || (node as any).__previousSibling) return;

  patchHostOriginalAccessor('previousSibling', node);
  Object.defineProperty(node, 'previousSibling', {
    get: function () {
      const parentNodes = this['s-ol']?.parentNode.childNodes;
      const index = parentNodes?.indexOf(this);
      if (parentNodes && index > -1) {
        return parentNodes[index - 1];
      }
      return this.__previousSibling;
    },
  });
};

/**
 * Patches the `previousElementSibling` accessor of a non-shadow slotted node
 *
 * @param element the slotted element node to be patched
 */
const patchPreviousElementSibling = (element: Element) => {
  if (!element || (element as any).__previousElementSibling) return;

  patchHostOriginalAccessor('previousElementSibling', element);
  Object.defineProperty(element, 'previousElementSibling', {
    get: function () {
      const parentNodes = this['s-ol']?.parentNode.children;
      const index = parentNodes?.indexOf(this);

      if (parentNodes && index > -1) {
        return parentNodes[index - 1];
      }
      return this.__previousElementSibling;
    },
  });
};

/**
 * Patches the `parentNode` accessor of a non-shadow slotted node
 *
 * @param node the slotted node to be patched
 */
export const patchParentNode = (node: Node) => {
  if (!node || (node as any).__parentNode) return;

  patchHostOriginalAccessor('parentNode', node);
  Object.defineProperty(node, 'parentNode', {
    get: function () {
      return this['s-ol']?.parentNode || this.__parentNode;
    },
    set: function (value) {
      // mock-doc sets parentNode?
      this.__parentNode = value;
    },
  });
};

/// UTILS ///

const validElementPatches = ['children', 'nextElementSibling', 'previousElementSibling'] as const;
const validNodesPatches = [
  'childNodes',
  'firstChild',
  'lastChild',
  'nextSibling',
  'previousSibling',
  'textContent',
  'parentNode',
] as const;

/**
 * Patches a node or element; making it's original accessor method available under a new name.
 * e.g. `nextSibling` -> `__nextSibling`
 *
 * @param accessorName - the name of the accessor to patch
 * @param node - the node to patch
 */
function patchHostOriginalAccessor(
  accessorName: (typeof validElementPatches)[number] | (typeof validNodesPatches)[number],
  node: Node,
) {
  let accessor;
  if (validElementPatches.includes(accessorName as any)) {
    accessor = Object.getOwnPropertyDescriptor(Element.prototype, accessorName);
  } else if (validNodesPatches.includes(accessorName as any)) {
    accessor = Object.getOwnPropertyDescriptor(Node.prototype, accessorName);
  }
  if (!accessor) {
    // for mock-doc
    accessor = Object.getOwnPropertyDescriptor(node, accessorName);
  }
  if (accessor) Object.defineProperty(node, '__' + accessorName, accessor);
}

/**
 * Get the original / internal accessor or method of a node or element.
 *
 * @param node - the node to get the accessor from
 * @param method - the name of the accessor to get
 *
 * @returns the original accessor or method of the node
 */
export function internalCall<T extends d.RenderNode, P extends keyof d.RenderNode>(node: T, method: P): T[P] {
  if ('__' + method in node) {
    const toReturn = node[('__' + method) as keyof d.RenderNode] as T[P];
    if (typeof toReturn !== 'function') return toReturn;
    return toReturn.bind(node) as T[P];
  } else {
    if (typeof node[method] !== 'function') return node[method];
    return node[method].bind(node) as T[P];
  }
}
