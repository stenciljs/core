/**
 * Virtual DOM patching algorithm based on Snabbdom by
 * Simon Friis Vindum (@paldepind)
 * Licensed under the MIT License
 * https://github.com/snabbdom/snabbdom/blob/master/LICENSE
 *
 * Modified for Stencil's renderer and slot projection
 */
import { BUILD } from '@app-data';
import { consoleDevError, plt, supportsShadow, win } from '@platform';
import { CMP_FLAGS, HTML_NS, isDef, NODE_TYPES, SVG_NS } from '@utils';

import type * as d from '../../declarations';
import { patchParentNode } from '../dom-extras';
import { NODE_TYPE, PLATFORM_FLAGS, VNODE_FLAGS } from '../runtime-constants';
import {
  dispatchSlotChangeEvent,
  findSlotFromSlottedNode,
  isNodeLocatedInSlot,
  patchSlotNode,
  updateFallbackSlotVisibility,
} from '../slot-polyfill-utils';
import { h, isHost, newVNode } from './h';
import { updateElement } from './update-element';

let scopeId: string;
let contentRef: d.RenderNode | undefined;
let hostTagName: string;
let useNativeShadowDom = false;
let checkSlotFallbackVisibility = false;
let checkSlotRelocate = false;
let isSvgMode = false;

/**
 * Create a DOM Node corresponding to one of the children of a given VNode.
 *
 * @param oldParentVNode the parent VNode from the previous render
 * @param newParentVNode the parent VNode from the current render
 * @param childIndex the index of the VNode, in the _new_ parent node's
 * children, for which we will create a new DOM node
 * @returns the newly created node
 */
const createElm = (oldParentVNode: d.VNode, newParentVNode: d.VNode, childIndex: number) => {
  // tslint:disable-next-line: prefer-const
  const newVNode = newParentVNode.$children$[childIndex];
  let i = 0;
  let elm: d.RenderNode;
  let childNode: d.RenderNode;
  let oldVNode: d.VNode;

  if (BUILD.slotRelocation && !useNativeShadowDom) {
    // remember for later we need to check to relocate nodes
    checkSlotRelocate = true;

    if (newVNode.$tag$ === 'slot') {
      newVNode.$flags$ |= newVNode.$children$
        ? // slot element has fallback content
          // still create an element that "mocks" the slot element
          VNODE_FLAGS.isSlotFallback
        : // slot element does not have fallback content
          // create an html comment we'll use to always reference
          // where actual slot content should sit next to
          VNODE_FLAGS.isSlotReference;
    }
  }

  if (BUILD.isDev && newVNode.$elm$) {
    consoleDevError(
      `The JSX ${
        newVNode.$text$ !== null ? `"${newVNode.$text$}" text` : `"${newVNode.$tag$}" element`
      } node should not be shared within the same renderer. The renderer caches element lookups in order to improve performance. However, a side effect from this is that the exact same JSX node should not be reused. For more information please see https://stenciljs.com/docs/templating-jsx#avoid-shared-jsx-nodes`,
    );
  }

  if (BUILD.vdomText && newVNode.$text$ !== null) {
    // create text node
    elm = newVNode.$elm$ = win.document.createTextNode(newVNode.$text$) as any;
  } else if (BUILD.slotRelocation && newVNode.$flags$ & VNODE_FLAGS.isSlotReference) {
    // create a slot reference node
    elm = newVNode.$elm$ =
      BUILD.isDebug || BUILD.hydrateServerSide
        ? slotReferenceDebugNode(newVNode)
        : (win.document.createTextNode('') as any);
    // add css classes, attrs, props, listeners, etc.
    if (BUILD.vdomAttribute) {
      updateElement(null, newVNode, isSvgMode);
    }
  } else {
    if (BUILD.svg && !isSvgMode) {
      isSvgMode = newVNode.$tag$ === 'svg';
    }

    if (!win.document) {
      throw new Error(
        "You are trying to render a Stencil component in an environment that doesn't support the DOM. " +
          'Make sure to populate the [`window`](https://developer.mozilla.org/en-US/docs/Web/API/Window/window) object before rendering a component.',
      );
    }

    // create element
    elm = newVNode.$elm$ = (
      BUILD.svg
        ? win.document.createElementNS(
            isSvgMode ? SVG_NS : HTML_NS,
            !useNativeShadowDom && BUILD.slotRelocation && newVNode.$flags$ & VNODE_FLAGS.isSlotFallback
              ? 'slot-fb'
              : (newVNode.$tag$ as string),
          )
        : win.document.createElement(
            !useNativeShadowDom && BUILD.slotRelocation && newVNode.$flags$ & VNODE_FLAGS.isSlotFallback
              ? 'slot-fb'
              : (newVNode.$tag$ as string),
          )
    ) as any;

    if (BUILD.svg && isSvgMode && newVNode.$tag$ === 'foreignObject') {
      isSvgMode = false;
    }
    // add css classes, attrs, props, listeners, etc.
    if (BUILD.vdomAttribute) {
      updateElement(null, newVNode, isSvgMode);
    }

    if (BUILD.scoped && isDef(scopeId) && elm['s-si'] !== scopeId) {
      // if this element is `scoped: true` all internal
      // children required the scope id class for styling
      elm.classList.add((elm['s-si'] = scopeId));
    }
    if (newVNode.$children$) {
      for (i = 0; i < newVNode.$children$.length; ++i) {
        // create the node
        childNode = createElm(oldParentVNode, newVNode, i);

        // return node could have been null
        if (childNode) {
          // append our new node
          elm.appendChild(childNode);
        }
      }
    }

    if (BUILD.svg) {
      if (newVNode.$tag$ === 'svg') {
        // Only reset the SVG context when we're exiting <svg> element
        isSvgMode = false;
      } else if (elm.tagName === 'foreignObject') {
        // Reenter SVG context when we're exiting <foreignObject> element
        isSvgMode = true;
      }
    }
  }

  // This needs to always happen so we can hide nodes that are projected
  // to another component but don't end up in a slot
  elm['s-hn'] = hostTagName;
  if (BUILD.slotRelocation) {
    if (newVNode.$flags$ & (VNODE_FLAGS.isSlotFallback | VNODE_FLAGS.isSlotReference)) {
      // remember the content reference comment
      elm['s-sr'] = true;

      // remember the content reference comment
      elm['s-cr'] = contentRef;

      // remember the slot name, or empty string for default slot
      elm['s-sn'] = newVNode.$name$ || '';

      // remember the ref callback function
      elm['s-rf'] = newVNode.$attrs$?.ref;

      // give this node `assignedElements` and `assignedNodes` methods
      patchSlotNode(elm);

      // check if we've got an old vnode for this slot
      oldVNode = oldParentVNode && oldParentVNode.$children$ && oldParentVNode.$children$[childIndex];
      if (oldVNode && oldVNode.$tag$ === newVNode.$tag$ && oldParentVNode.$elm$) {
        if (BUILD.experimentalSlotFixes) {
          // we've got an old slot vnode and the wrapper is being replaced
          // so let's move the old slot content to the root of the element currently being rendered
          relocateToHostRoot(oldParentVNode.$elm$);
        } else {
          // we've got an old slot vnode and the wrapper is being replaced
          // so let's move the old slot content back to its original location
          putBackInOriginalLocation(oldParentVNode.$elm$, false);
        }
      }
      if (BUILD.scoped) {
        addRemoveSlotScopedClass(contentRef, elm, newParentVNode.$elm$, oldParentVNode?.$elm$);
      }
    }
  }

  return elm;
};

/**
 * Relocates all child nodes of an element that were a part of a previous slot relocation
 * to the root of the Stencil component currently being rendered. This happens when a parent
 * element of a slot reference node dynamically changes and triggers a re-render. We cannot use
 * `putBackInOriginalLocation()` because that may relocate nodes to elements that will not be re-rendered
 * and so they will not be relocated again.
 *
 * @param parentElm The element potentially containing relocated nodes.
 */
const relocateToHostRoot = (parentElm: Element) => {
  plt.$flags$ |= PLATFORM_FLAGS.isTmpDisconnected;

  const host = parentElm.closest(hostTagName.toLowerCase());
  if (host != null) {
    const contentRefNode = (Array.from((host as d.RenderNode).__childNodes || host.childNodes) as d.RenderNode[]).find(
      (ref) => ref['s-cr'],
    );
    const childNodeArray = Array.from(
      (parentElm as d.RenderNode).__childNodes || parentElm.childNodes,
    ) as d.RenderNode[];

    // If we have a content ref, we need to invert the order of the nodes we're relocating
    // to preserve the correct order of elements in the DOM on future relocations
    for (const childNode of contentRefNode ? childNodeArray.reverse() : childNodeArray) {
      // Only relocate nodes that were slotted in
      if (childNode['s-sh'] != null) {
        insertBefore(host, childNode, contentRefNode ?? null);

        // Reset so we can correctly move the node around again.
        childNode['s-sh'] = undefined;

        // Need to tell the render pipeline to check to relocate slot content again
        checkSlotRelocate = true;
      }
    }
  }

  plt.$flags$ &= ~PLATFORM_FLAGS.isTmpDisconnected;
};

/**
 * Puts `<slot>` nodes and any slotted nodes back to their original location (wherever they were before being slotted).
 *
 * @param parentElm - The parent element of the nodes to relocate.
 * @param recursive - Whether or not to relocate nodes in child nodes as well.
 */
const putBackInOriginalLocation = (parentElm: d.RenderNode, recursive: boolean) => {
  plt.$flags$ |= PLATFORM_FLAGS.isTmpDisconnected;
  const oldSlotChildNodes: ChildNode[] = Array.from(parentElm.__childNodes || parentElm.childNodes);

  if (parentElm['s-sr'] && BUILD.experimentalSlotFixes) {
    let node = parentElm;
    while ((node = node.nextSibling as d.RenderNode)) {
      if (node && node['s-sn'] === parentElm['s-sn'] && node['s-sh'] === hostTagName) {
        oldSlotChildNodes.push(node);
      }
    }
  }

  for (let i = oldSlotChildNodes.length - 1; i >= 0; i--) {
    const childNode = oldSlotChildNodes[i] as any;
    if (childNode['s-hn'] !== hostTagName && childNode['s-ol']) {
      // and relocate it back to it's original location
      insertBefore(referenceNode(childNode).parentNode, childNode, referenceNode(childNode));

      // remove the old original location comment entirely
      // later on the patch function will know what to do
      // and move this to the correct spot if need be
      childNode['s-ol'].remove();
      childNode['s-ol'] = undefined;

      // Reset so we can correctly move the node around again.
      childNode['s-sh'] = undefined;

      checkSlotRelocate = true;
    }

    if (recursive) {
      putBackInOriginalLocation(childNode, recursive);
    }
  }

  plt.$flags$ &= ~PLATFORM_FLAGS.isTmpDisconnected;
};

/**
 * Create DOM nodes corresponding to a list of {@link d.Vnode} objects and
 * add them to the DOM in the appropriate place.
 *
 * @param parentElm the DOM node which should be used as a parent for the new
 * DOM nodes
 * @param before a child of the `parentElm` which the new children should be
 * inserted before (optional)
 * @param parentVNode the parent virtual DOM node
 * @param vnodes the new child virtual DOM nodes to produce DOM nodes for
 * @param startIdx the index in the child virtual DOM nodes at which to start
 * creating DOM nodes (inclusive)
 * @param endIdx the index in the child virtual DOM nodes at which to stop
 * creating DOM nodes (inclusive)
 */
const addVnodes = (
  parentElm: d.RenderNode,
  before: d.RenderNode,
  parentVNode: d.VNode,
  vnodes: d.VNode[],
  startIdx: number,
  endIdx: number,
) => {
  let containerElm = ((BUILD.slotRelocation && parentElm['s-cr'] && parentElm['s-cr'].parentNode) || parentElm) as any;
  let childNode: Node;
  if (BUILD.shadowDom && (containerElm as any).shadowRoot && containerElm.tagName === hostTagName) {
    containerElm = (containerElm as any).shadowRoot;
  }

  for (; startIdx <= endIdx; ++startIdx) {
    if (vnodes[startIdx]) {
      childNode = createElm(null, parentVNode, startIdx);
      if (childNode) {
        vnodes[startIdx].$elm$ = childNode as any;
        insertBefore(containerElm, childNode as d.RenderNode, BUILD.slotRelocation ? referenceNode(before) : before);
      }
    }
  }
};

/**
 * Remove the DOM elements corresponding to a list of {@link d.VNode} objects.
 * This can be used to, for instance, clean up after a list of children which
 * should no longer be shown.
 *
 * This function also handles some of Stencil's slot relocation logic.
 *
 * @param vnodes a list of virtual DOM nodes to remove
 * @param startIdx the index at which to start removing nodes (inclusive)
 * @param endIdx the index at which to stop removing nodes (inclusive)
 */
const removeVnodes = (vnodes: d.VNode[], startIdx: number, endIdx: number) => {
  for (let index = startIdx; index <= endIdx; ++index) {
    const vnode = vnodes[index];
    if (vnode) {
      const elm = vnode.$elm$;
      nullifyVNodeRefs(vnode);

      if (elm) {
        if (BUILD.slotRelocation) {
          // we're removing this element
          // so it's possible we need to show slot fallback content now
          checkSlotFallbackVisibility = true;

          if (elm['s-ol']) {
            // remove the original location comment
            elm['s-ol'].remove();
          } else {
            // it's possible that child nodes of the node
            // that's being removed are slot nodes
            putBackInOriginalLocation(elm, true);
          }
        }

        // remove the vnode's element from the dom
        elm.remove();
      }
    }
  }
};

/**
 * Reconcile the children of a new VNode with the children of an old VNode by
 * traversing the two collections of children, identifying nodes that are
 * conserved or changed, calling out to `patch` to make any necessary
 * updates to the DOM, and rearranging DOM nodes as needed.
 *
 * The algorithm for reconciling children works by analyzing two 'windows' onto
 * the two arrays of children (`oldCh` and `newCh`). We keep track of the
 * 'windows' by storing start and end indices and references to the
 * corresponding array entries. Initially the two 'windows' are basically equal
 * to the entire array, but we progressively narrow the windows until there are
 * no children left to update by doing the following:
 *
 * 1. Skip any `null` entries at the beginning or end of the two arrays, so
 *    that if we have an initial array like the following we'll end up dealing
 *    only with a window bounded by the highlighted elements:
 *
 *    [null, null, VNode1 , ... , VNode2, null, null]
 *                 ^^^^^^         ^^^^^^
 *
 * 2. Check to see if the elements at the head and tail positions are equal
 *    across the windows. This will basically detect elements which haven't
 *    been added, removed, or changed position, i.e. if you had the following
 *    VNode elements (represented as HTML):
 *
 *    oldVNode: `<div><p><span>HEY</span></p></div>`
 *    newVNode: `<div><p><span>THERE</span></p></div>`
 *
 *    Then when comparing the children of the `<div>` tag we check the equality
 *    of the VNodes corresponding to the `<p>` tags and, since they are the
 *    same tag in the same position, we'd be able to avoid completely
 *    re-rendering the subtree under them with a new DOM element and would just
 *    call out to `patch` to handle reconciling their children and so on.
 *
 * 3. Check, for both windows, to see if the element at the beginning of the
 *    window corresponds to the element at the end of the other window. This is
 *    a heuristic which will let us identify _some_ situations in which
 *    elements have changed position, for instance it _should_ detect that the
 *    children nodes themselves have not changed but merely moved in the
 *    following example:
 *
 *    oldVNode: `<div><element-one /><element-two /></div>`
 *    newVNode: `<div><element-two /><element-one /></div>`
 *
 *    If we find cases like this then we also need to move the concrete DOM
 *    elements corresponding to the moved children to write the re-order to the
 *    DOM.
 *
 * 4. Finally, if VNodes have the `key` attribute set on them we check for any
 *    nodes in the old children which have the same key as the first element in
 *    our window on the new children. If we find such a node we handle calling
 *    out to `patch`, moving relevant DOM nodes, and so on, in accordance with
 *    what we find.
 *
 * Finally, once we've narrowed our 'windows' to the point that either of them
 * collapse (i.e. they have length 0) we then handle any remaining VNode
 * insertion or deletion that needs to happen to get a DOM state that correctly
 * reflects the new child VNodes. If, for instance, after our window on the old
 * children has collapsed we still have more nodes on the new children that
 * we haven't dealt with yet then we need to add them, or if the new children
 * collapse but we still have unhandled _old_ children then we need to make
 * sure the corresponding DOM nodes are removed.
 *
 * @param parentElm the node into which the parent VNode is rendered
 * @param oldCh the old children of the parent node
 * @param newVNode the new VNode which will replace the parent
 * @param newCh the new children of the parent node
 * @param isInitialRender whether or not this is the first render of the vdom
 */
const updateChildren = (
  parentElm: d.RenderNode,
  oldCh: d.VNode[],
  newVNode: d.VNode,
  newCh: d.VNode[],
  isInitialRender = false,
) => {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let idxInOld = 0;
  let i = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let node: Node;
  let elmToMove: d.VNode;

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (oldStartVnode == null) {
      // VNode might have been moved left
      oldStartVnode = oldCh[++oldStartIdx];
    } else if (oldEndVnode == null) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (newStartVnode == null) {
      newStartVnode = newCh[++newStartIdx];
    } else if (newEndVnode == null) {
      newEndVnode = newCh[--newEndIdx];
    } else if (isSameVnode(oldStartVnode, newStartVnode, isInitialRender)) {
      // if the start nodes are the same then we should patch the new VNode
      // onto the old one, and increment our `newStartIdx` and `oldStartIdx`
      // indices to reflect that. We don't need to move any DOM Nodes around
      // since things are matched up in order.
      patch(oldStartVnode, newStartVnode, isInitialRender);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (isSameVnode(oldEndVnode, newEndVnode, isInitialRender)) {
      // likewise, if the end nodes are the same we patch new onto old and
      // decrement our end indices, and also likewise in this case we don't
      // need to move any DOM Nodes.
      patch(oldEndVnode, newEndVnode, isInitialRender);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (isSameVnode(oldStartVnode, newEndVnode, isInitialRender)) {
      // case: "Vnode moved right"
      //
      // We've found that the last node in our window on the new children is
      // the same VNode as the _first_ node in our window on the old children
      // we're dealing with now. Visually, this is the layout of these two
      // nodes:
      //
      // newCh: [..., newStartVnode , ... , newEndVnode , ...]
      //                                    ^^^^^^^^^^^
      // oldCh: [..., oldStartVnode , ... , oldEndVnode , ...]
      //              ^^^^^^^^^^^^^
      //
      // In this situation we need to patch `newEndVnode` onto `oldStartVnode`
      // and move the DOM element for `oldStartVnode`.
      if (BUILD.slotRelocation && (oldStartVnode.$tag$ === 'slot' || newEndVnode.$tag$ === 'slot')) {
        putBackInOriginalLocation(oldStartVnode.$elm$.parentNode, false);
      }
      patch(oldStartVnode, newEndVnode, isInitialRender);
      // We need to move the element for `oldStartVnode` into a position which
      // will be appropriate for `newEndVnode`. For this we can use
      // `.insertBefore` and `oldEndVnode.$elm$.nextSibling`. If there is a
      // sibling for `oldEndVnode.$elm$` then we want to move the DOM node for
      // `oldStartVnode` between `oldEndVnode` and it's sibling, like so:
      //
      // <old-start-node />
      // <some-intervening-node />
      // <old-end-node />
      // <!-- ->              <-- `oldStartVnode.$elm$` should be inserted here
      // <next-sibling />
      //
      // If instead `oldEndVnode.$elm$` has no sibling then we just want to put
      // the node for `oldStartVnode` at the end of the children of
      // `parentElm`. Luckily, `Node.nextSibling` will return `null` if there
      // aren't any siblings, and passing `null` to `Node.insertBefore` will
      // append it to the children of the parent element.
      insertBefore(parentElm, oldStartVnode.$elm$, oldEndVnode.$elm$.nextSibling as any);
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (isSameVnode(oldEndVnode, newStartVnode, isInitialRender)) {
      // case: "Vnode moved left"
      //
      // We've found that the first node in our window on the new children is
      // the same VNode as the _last_ node in our window on the old children.
      // Visually, this is the layout of these two nodes:
      //
      // newCh: [..., newStartVnode , ... , newEndVnode , ...]
      //              ^^^^^^^^^^^^^
      // oldCh: [..., oldStartVnode , ... , oldEndVnode , ...]
      //                                    ^^^^^^^^^^^
      //
      // In this situation we need to patch `newStartVnode` onto `oldEndVnode`
      // (which will handle updating any changed attributes, reconciling their
      // children etc) but we also need to move the DOM node to which
      // `oldEndVnode` corresponds.
      if (BUILD.slotRelocation && (oldStartVnode.$tag$ === 'slot' || newEndVnode.$tag$ === 'slot')) {
        putBackInOriginalLocation(oldEndVnode.$elm$.parentNode, false);
      }
      patch(oldEndVnode, newStartVnode, isInitialRender);
      // We've already checked above if `oldStartVnode` and `newStartVnode` are
      // the same node, so since we're here we know that they are not. Thus we
      // can move the element for `oldEndVnode` _before_ the element for
      // `oldStartVnode`, leaving `oldStartVnode` to be reconciled in the
      // future.
      insertBefore(parentElm, oldEndVnode.$elm$, oldStartVnode.$elm$);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      // Here we do some checks to match up old and new nodes based on the
      // `$key$` attribute, which is set by putting a `key="my-key"` attribute
      // in the JSX for a DOM element in the implementation of a Stencil
      // component.
      //
      // First we check to see if there are any nodes in the array of old
      // children which have the same key as the first node in the new
      // children.
      idxInOld = -1;
      if (BUILD.vdomKey) {
        for (i = oldStartIdx; i <= oldEndIdx; ++i) {
          if (oldCh[i] && oldCh[i].$key$ !== null && oldCh[i].$key$ === newStartVnode.$key$) {
            idxInOld = i;
            break;
          }
        }
      }

      if (BUILD.vdomKey && idxInOld >= 0) {
        // We found a node in the old children which matches up with the first
        // node in the new children! So let's deal with that
        elmToMove = oldCh[idxInOld];

        if (elmToMove.$tag$ !== newStartVnode.$tag$) {
          // the tag doesn't match so we'll need a new DOM element
          node = createElm(oldCh && oldCh[newStartIdx], newVNode, idxInOld);
        } else {
          patch(elmToMove, newStartVnode, isInitialRender);
          // invalidate the matching old node so that we won't try to update it
          // again later on
          oldCh[idxInOld] = undefined;
          node = elmToMove.$elm$;
        }

        newStartVnode = newCh[++newStartIdx];
      } else {
        // We either didn't find an element in the old children that matches
        // the key of the first new child OR the build is not using `key`
        // attributes at all. In either case we need to create a new element
        // for the new node.
        node = createElm(oldCh && oldCh[newStartIdx], newVNode, newStartIdx);
        newStartVnode = newCh[++newStartIdx];
      }

      if (node) {
        // if we created a new node then handle inserting it to the DOM
        if (BUILD.slotRelocation) {
          insertBefore(
            referenceNode(oldStartVnode.$elm$).parentNode,
            node as d.RenderNode,
            referenceNode(oldStartVnode.$elm$),
          );
        } else {
          insertBefore(oldStartVnode.$elm$.parentNode, node as d.RenderNode, oldStartVnode.$elm$);
        }
      }
    }
  }

  if (oldStartIdx > oldEndIdx) {
    // we have some more new nodes to add which don't match up with old nodes
    addVnodes(
      parentElm,
      newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].$elm$,
      newVNode,
      newCh,
      newStartIdx,
      newEndIdx,
    );
  } else if (BUILD.updatable && newStartIdx > newEndIdx) {
    // there are nodes in the `oldCh` array which no longer correspond to nodes
    // in the new array, so lets remove them (which entails cleaning up the
    // relevant DOM nodes)
    removeVnodes(oldCh, oldStartIdx, oldEndIdx);
  }
};

/**
 * Compare two VNodes to determine if they are the same
 *
 * **NB**: This function is an equality _heuristic_ based on the available
 * information set on the two VNodes and can be misleading under certain
 * circumstances. In particular, if the two nodes do not have `key` attrs
 * (available under `$key$` on VNodes) then the function falls back on merely
 * checking that they have the same tag.
 *
 * So, in other words, if `key` attrs are not set on VNodes which may be
 * changing order within a `children` array or something along those lines then
 * we could obtain a false negative and then have to do needless re-rendering
 * (i.e. we'd say two VNodes aren't equal when in fact they should be).
 *
 * @param leftVNode the first VNode to check
 * @param rightVNode the second VNode to check
 * @param isInitialRender whether or not this is the first render of the vdom
 * @returns whether they're equal or not
 */
export const isSameVnode = (leftVNode: d.VNode, rightVNode: d.VNode, isInitialRender = false) => {
  // compare if two vnode to see if they're "technically" the same
  // need to have the same element tag, and same key to be the same
  if (leftVNode.$tag$ === rightVNode.$tag$) {
    if (BUILD.slotRelocation && leftVNode.$tag$ === 'slot') {
      return leftVNode.$name$ === rightVNode.$name$;
    }
    // this will be set if JSX tags in the build have `key` attrs set on them
    // we only want to check this if we're not on the first render since on
    // first render `leftVNode.$key$` will always be `null`, so we can be led
    // astray and, for instance, accidentally delete a DOM node that we want to
    // keep around.
    if (BUILD.vdomKey && !isInitialRender) {
      return leftVNode.$key$ === rightVNode.$key$;
    }
    // if we're comparing the same node and it's the initial render,
    // let's set the $key$ property to the rightVNode so we don't cause re-renders
    if (isInitialRender && !leftVNode.$key$ && rightVNode.$key$) {
      leftVNode.$key$ = rightVNode.$key$;
    }
    return true;
  }
  return false;
};

/**
 * Returns the reference node (a comment which represents the
 * original location of a node in the vdom - before it was moved to its slot)
 * of a given node.
 *
 * (slot nodes can be relocated to a new location in the dom because of
 * some other component's slot)
 * @param node the node to find the original location reference node for
 * @returns reference node
 */
const referenceNode = (node: d.RenderNode) => (node && node['s-ol']) || node;

/**
 * Handle reconciling an outdated VNode with a new one which corresponds to
 * it. This function handles flushing updates to the DOM and reconciling the
 * children of the two nodes (if any).
 *
 * @param oldVNode an old VNode whose DOM element and children we want to update
 * @param newVNode a new VNode representing an updated version of the old one
 * @param isInitialRender whether or not this is the first render of the vdom
 */
export const patch = (oldVNode: d.VNode, newVNode: d.VNode, isInitialRender = false) => {
  const elm = (newVNode.$elm$ = oldVNode.$elm$);
  const oldChildren = oldVNode.$children$;
  const newChildren = newVNode.$children$;
  const tag = newVNode.$tag$;
  const text = newVNode.$text$;
  let defaultHolder: Comment;

  if (!BUILD.vdomText || text === null) {
    if (BUILD.svg) {
      // test if we're rendering an svg element, or still rendering nodes inside of one
      // only add this to the when the compiler sees we're using an svg somewhere
      isSvgMode = tag === 'svg' ? true : tag === 'foreignObject' ? false : isSvgMode;
    }

    if (BUILD.vdomAttribute || BUILD.reflect) {
      if (BUILD.slot && tag === 'slot' && !useNativeShadowDom) {
        if (BUILD.experimentalSlotFixes && oldVNode.$name$ !== newVNode.$name$) {
          newVNode.$elm$['s-sn'] = newVNode.$name$ || '';
          relocateToHostRoot(newVNode.$elm$.parentElement);
        }
      }
      // either this is the first render of an element OR it's an update
      // AND we already know it's possible it could have changed
      // this updates the element's css classes, attrs, props, listeners, etc.
      updateElement(oldVNode, newVNode, isSvgMode, isInitialRender);
    }

    if (BUILD.updatable && oldChildren !== null && newChildren !== null) {
      // looks like there's child vnodes for both the old and new vnodes
      // so we need to call `updateChildren` to reconcile them
      updateChildren(elm, oldChildren, newVNode, newChildren, isInitialRender);
    } else if (newChildren !== null) {
      // no old child vnodes, but there are new child vnodes to add
      if (BUILD.updatable && BUILD.vdomText && oldVNode.$text$ !== null) {
        // the old vnode was text, so be sure to clear it out
        elm.textContent = '';
      }
      // add the new vnode children
      addVnodes(elm, null, newVNode, newChildren, 0, newChildren.length - 1);
    } else if (
      // don't do this on initial render as it can cause non-hydrated content to be removed
      !isInitialRender &&
      BUILD.updatable &&
      oldChildren !== null
    ) {
      // no new child vnodes, but there are old child vnodes to remove
      removeVnodes(oldChildren, 0, oldChildren.length - 1);
    }

    if (BUILD.svg && isSvgMode && tag === 'svg') {
      isSvgMode = false;
    }
  } else if (BUILD.vdomText && BUILD.slotRelocation && (defaultHolder = elm['s-cr'] as any)) {
    // this element has slotted content
    defaultHolder.parentNode.textContent = text;
  } else if (BUILD.vdomText && oldVNode.$text$ !== text) {
    // update the text content for the text only vnode
    // and also only if the text is different than before
    elm.data = text;
  }
};

/**
 * Component-global information about nodes which are either currently being
 * relocated or will be shortly.
 */
const relocateNodes: RelocateNodeData[] = [];

/**
 * Mark the contents of a slot for relocation via adding references to them to
 * the {@link relocateNodes} data structure. The actual work of relocating them
 * will then be handled in {@link renderVdom}.
 *
 * @param elm a render node whose child nodes need to be relocated
 */
const markSlotContentForRelocation = (elm: d.RenderNode) => {
  // tslint:disable-next-line: prefer-const
  let node: d.RenderNode;
  let hostContentNodes: NodeList;
  let j;

  const children = elm.__childNodes || elm.childNodes;
  for (const childNode of children as unknown as d.RenderNode[]) {
    // we need to find child nodes which are slot references so we can then try
    // to match them up with nodes that need to be relocated
    if (childNode['s-sr'] && (node = childNode['s-cr']) && node.parentNode) {
      // first get the content reference comment node ('s-cr'), then we get
      // its parent, which is where all the host content is now
      hostContentNodes = (node.parentNode as d.RenderNode).__childNodes || node.parentNode.childNodes;
      const slotName = childNode['s-sn'];

      // iterate through all the nodes under the location where the host was
      // originally rendered
      for (j = hostContentNodes.length - 1; j >= 0; j--) {
        node = hostContentNodes[j] as d.RenderNode;

        // check that the node is not a content reference node or a node
        // reference and then check that the host name does not match that of
        // childNode.
        // In addition, check that the slot either has not already been relocated, or
        // that its current location's host is not childNode's host. This is essentially
        // a check so that we don't try to relocate (and then hide) a node that is already
        // where it should be.
        if (
          !node['s-cn'] &&
          !node['s-nr'] &&
          node['s-hn'] !== childNode['s-hn'] &&
          (!BUILD.experimentalSlotFixes || !node['s-sh'] || node['s-sh'] !== childNode['s-hn'])
        ) {
          // if `node` is located in the slot that `childNode` refers to (via the
          // `'s-sn'` property) then we need to relocate it from it's current spot
          // (under the host element parent) to the right slot location
          if (isNodeLocatedInSlot(node, slotName)) {
            // it's possible we've already decided to relocate this node
            let relocateNodeData = relocateNodes.find((r) => r.$nodeToRelocate$ === node);

            // made some changes to slots
            // let's make sure we also double check
            // fallbacks are correctly hidden or shown
            checkSlotFallbackVisibility = true;
            // ensure that the slot-name attr is correct
            node['s-sn'] = node['s-sn'] || slotName;

            if (relocateNodeData) {
              relocateNodeData.$nodeToRelocate$['s-sh'] = childNode['s-hn'];
              // we marked this node for relocation previously but didn't find
              // out the slot reference node to which it needs to be relocated
              // so write it down now!
              relocateNodeData.$slotRefNode$ = childNode;
            } else {
              node['s-sh'] = childNode['s-hn'];
              // add to our list of nodes to relocate
              relocateNodes.push({
                $slotRefNode$: childNode,
                $nodeToRelocate$: node,
              });
            }

            if (node['s-sr']) {
              relocateNodes.map((relocateNode) => {
                if (isNodeLocatedInSlot(relocateNode.$nodeToRelocate$, node['s-sn'])) {
                  relocateNodeData = relocateNodes.find((r) => r.$nodeToRelocate$ === node);

                  if (relocateNodeData && !relocateNode.$slotRefNode$) {
                    relocateNode.$slotRefNode$ = relocateNodeData.$slotRefNode$;
                  }
                }
              });
            }
          } else if (!relocateNodes.some((r) => r.$nodeToRelocate$ === node)) {
            // the node is not found within the slot (`childNode`) that we're
            // currently looking at, so we stick it into `relocateNodes` to
            // handle later. If we never find a home for this element then
            // we'll need to hide it
            relocateNodes.push({
              $nodeToRelocate$: node,
            });
          }
        }
      }
    }

    // if we're dealing with any type of element (capable of itself being a
    // slot reference or containing one) then we recur
    if (childNode.nodeType === NODE_TYPE.ElementNode) {
      markSlotContentForRelocation(childNode);
    }
  }
};

/**
 * 'Nullify' any VDom `ref` callbacks on a VDom node or its children by calling
 * them with `null`. This signals that the DOM element corresponding to the VDom
 * node has been removed from the DOM.
 *
 * @param vNode a virtual DOM node
 */
export const nullifyVNodeRefs = (vNode: d.VNode) => {
  if (BUILD.vdomRef) {
    vNode.$attrs$ && vNode.$attrs$.ref && vNode.$attrs$.ref(null);
    vNode.$children$ && vNode.$children$.map(nullifyVNodeRefs);
  }
};

/**
 * Inserts a node before a reference node as a child of a specified parent node.
 * Additionally, adds parent elements' scope ids as class names to the new node.
 *
 * @param parent parent node
 * @param newNode element to be inserted
 * @param reference anchor element
 * @returns inserted node
 */
export const insertBefore = (
  parent: Node,
  newNode: d.RenderNode,
  reference?: d.RenderNode | d.PatchedSlotNode,
): Node => {
  if (BUILD.scoped && typeof newNode['s-sn'] === 'string' && !!newNode['s-sr'] && !!newNode['s-cr']) {
    // this is a slot node
    addRemoveSlotScopedClass(newNode['s-cr'], newNode, parent as d.RenderNode, newNode.parentElement);
  } else if (BUILD.experimentalSlotFixes && typeof newNode['s-sn'] === 'string') {
    // this is a slotted node.
    if (parent.getRootNode().nodeType !== NODE_TYPES.DOCUMENT_FRAGMENT_NODE) {
      // we don't need to patch this node if it's nested in a shadow root
      patchParentNode(newNode);
    }
    // potentially use the patched insertBefore method. This will correctly slot the new node
    parent.insertBefore(newNode, reference);

    // if we find a corresponding slot node, dispatch a slotchange event now
    const { slotNode } = findSlotFromSlottedNode(newNode);
    if (slotNode) dispatchSlotChangeEvent(slotNode);

    return newNode;
  }

  if (BUILD.experimentalSlotFixes && (parent as d.RenderNode).__insertBefore) {
    return (parent as d.RenderNode).__insertBefore(newNode, reference) as d.RenderNode;
  } else {
    return parent?.insertBefore(newNode, reference) as d.RenderNode;
  }
};

/**
 * Adds or removes a scoped class to the parent element of a slotted node.
 * This is used for styling slotted content (e.g. with `::scoped(...) {...}` selectors )
 * in `scoped: true` components.
 *
 * @param reference - Content Reference Node. Used to get the scope id of the parent component.
 * @param slotNode - the `<slot>` node to apply the class for
 * @param newParent - the slots' new parent element that requires the scoped class
 * @param oldParent - optionally, an old parent element that may no longer require the scoped class
 */
function addRemoveSlotScopedClass(
  reference: d.RenderNode,
  slotNode: d.RenderNode,
  newParent: Element,
  oldParent?: Element,
) {
  // if the new node to move is slotted,
  // find it's original parent component and see if has a scope id
  let scopeId: string;
  if (
    reference &&
    typeof slotNode['s-sn'] === 'string' &&
    !!slotNode['s-sr'] &&
    reference.parentNode &&
    (reference.parentNode as d.RenderNode)['s-sc'] &&
    (scopeId = slotNode['s-si'] || (reference.parentNode as d.RenderNode)['s-sc'])
  ) {
    const scopeName = slotNode['s-sn'];
    const hostName = slotNode['s-hn'];

    // we found the original parent component's scoped id
    // let's add a scoped-slot class to this slotted node's parent
    newParent.classList?.add(scopeId + '-s');

    if (oldParent && oldParent.classList?.contains(scopeId + '-s')) {
      let child = ((oldParent as d.RenderNode).__childNodes || oldParent.childNodes)[0] as d.RenderNode;
      let found = false;

      while (child) {
        if (child['s-sn'] !== scopeName && child['s-hn'] === hostName && !!child['s-sr']) {
          found = true;
          break;
        }
        child = child.nextSibling as d.RenderNode;
      }

      // there are no other slots in the old parent
      // let's remove the scoped-slot class
      if (!found) oldParent.classList.remove(scopeId + '-s');
    }
  }
}
/**
 * Information about nodes to be relocated in order to support
 * `<slot>` elements in scoped (i.e. non-shadow DOM) components
 */
interface RelocateNodeData {
  $slotRefNode$?: d.RenderNode;
  $nodeToRelocate$: d.RenderNode;
}

/**
 * The main entry point for Stencil's virtual DOM-based rendering engine
 *
 * Given a {@link d.HostRef} container and some virtual DOM nodes, this
 * function will handle creating a virtual DOM tree with a single root, patching
 * the current virtual DOM tree onto an old one (if any), dealing with slot
 * relocation, and reflecting attributes.
 *
 * @param hostRef data needed to root and render the virtual DOM tree, such as
 * the DOM node into which it should be rendered.
 * @param renderFnResults the virtual DOM nodes to be rendered
 * @param isInitialLoad whether or not this is the first call after page load
 */
export const renderVdom = (hostRef: d.HostRef, renderFnResults: d.VNode | d.VNode[], isInitialLoad = false) => {
  const hostElm = hostRef.$hostElement$;
  const cmpMeta = hostRef.$cmpMeta$;
  const oldVNode: d.VNode = hostRef.$vnode$ || newVNode(null, null);

  // if `renderFnResults` is a Host node then we can use it directly. If not,
  // we need to call `h` again to wrap the children of our component in a
  // 'dummy' Host node (well, an empty vnode) since `renderVdom` assumes
  // implicitly that the top-level vdom node is 1) an only child and 2)
  // contains attrs that need to be set on the host element.
  const rootVnode = isHost(renderFnResults) ? renderFnResults : h(null, null, renderFnResults as any);

  hostTagName = hostElm.tagName;

  // <Host> runtime check
  if (BUILD.isDev && Array.isArray(renderFnResults) && renderFnResults.some(isHost)) {
    throw new Error(`The <Host> must be the single root component.
Looks like the render() function of "${hostTagName.toLowerCase()}" is returning an array that contains the <Host>.

The render() function should look like this instead:

render() {
  // Do not return an array
  return (
    <Host>{content}</Host>
  );
}
  `);
  }

  if (BUILD.reflect && cmpMeta.$attrsToReflect$) {
    rootVnode.$attrs$ = rootVnode.$attrs$ || {};
    cmpMeta.$attrsToReflect$.map(
      ([propName, attribute]) => (rootVnode.$attrs$[attribute] = (hostElm as any)[propName]),
    );
  }

  // On the first render and *only* on the first render we want to check for
  // any attributes set on the host element which are also set on the vdom
  // node. If we find them, we override the value on the VDom node attrs with
  // the value from the host element, which allows developers building apps
  // with Stencil components to override e.g. the `role` attribute on a
  // component even if it's already set on the `Host`.
  if (isInitialLoad && rootVnode.$attrs$) {
    for (const key of Object.keys(rootVnode.$attrs$)) {
      // We have a special implementation in `setAccessor` for `style` and
      // `class` which reconciles values coming from the VDom with values
      // already present on the DOM element, so we don't want to override those
      // attributes on the VDom tree with values from the host element if they
      // are present.
      //
      // Likewise, `ref` and `key` are special internal values for the Stencil
      // runtime and we don't want to override those either.
      if (hostElm.hasAttribute(key) && !['key', 'ref', 'style', 'class'].includes(key)) {
        rootVnode.$attrs$[key] = hostElm[key as keyof d.HostElement];
      }
    }
  }

  rootVnode.$tag$ = null;
  rootVnode.$flags$ |= VNODE_FLAGS.isHost;
  hostRef.$vnode$ = rootVnode;
  rootVnode.$elm$ = oldVNode.$elm$ = (BUILD.shadowDom ? hostElm.shadowRoot || hostElm : hostElm) as any;

  if (BUILD.scoped || BUILD.shadowDom) {
    scopeId = hostElm['s-sc'];
  }

  useNativeShadowDom =
    supportsShadow &&
    !!(cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation) &&
    !(cmpMeta.$flags$ & CMP_FLAGS.shadowNeedsScopedCss);
  if (BUILD.slotRelocation) {
    contentRef = hostElm['s-cr'];

    // always reset
    checkSlotFallbackVisibility = false;
  }

  // synchronous patch
  patch(oldVNode, rootVnode, isInitialLoad);

  if (BUILD.slotRelocation) {
    // while we're moving nodes around existing nodes, temporarily disable
    // the disconnectCallback from working
    plt.$flags$ |= PLATFORM_FLAGS.isTmpDisconnected;

    if (checkSlotRelocate) {
      markSlotContentForRelocation(rootVnode.$elm$);

      for (const relocateData of relocateNodes) {
        const nodeToRelocate = relocateData.$nodeToRelocate$;

        if (!nodeToRelocate['s-ol'] && win.document) {
          // add a reference node marking this node's original location
          // keep a reference to this node for later lookups
          const orgLocationNode =
            BUILD.isDebug || BUILD.hydrateServerSide
              ? originalLocationDebugNode(nodeToRelocate)
              : (win.document.createTextNode('') as any);
          orgLocationNode['s-nr'] = nodeToRelocate;

          insertBefore(nodeToRelocate.parentNode, (nodeToRelocate['s-ol'] = orgLocationNode), nodeToRelocate);
        }
      }

      for (const relocateData of relocateNodes) {
        const nodeToRelocate = relocateData.$nodeToRelocate$;
        const slotRefNode = relocateData.$slotRefNode$;

        if (slotRefNode) {
          const parentNodeRef = slotRefNode.parentNode;
          // When determining where to insert content, the most simple case would be
          // to relocate the node immediately following the slot reference node. We do this
          // by getting a reference to the node immediately following the slot reference node
          // since we will use `insertBefore` to manipulate the DOM.
          //
          // If there is no node immediately following the slot reference node, then we will just
          // end up appending the node as the last child of the parent.
          let insertBeforeNode = slotRefNode.nextSibling as d.RenderNode | null;

          // If the node we're currently planning on inserting the new node before is an element,
          // we need to do some additional checks to make sure we're inserting the node in the correct order.
          // The use case here would be that we have multiple nodes being relocated to the same slot. So, we want
          // to make sure they get inserted into their new home in the same order they were declared in their original location.
          //
          // TODO(STENCIL-914): Remove `experimentalSlotFixes` check
          if (
            !BUILD.hydrateServerSide &&
            (!BUILD.experimentalSlotFixes || (insertBeforeNode && insertBeforeNode.nodeType === NODE_TYPE.ElementNode))
          ) {
            let orgLocationNode = nodeToRelocate['s-ol']?.previousSibling as d.RenderNode | null;
            while (orgLocationNode) {
              let refNode = (orgLocationNode['s-nr'] as d.RenderNode) ?? null;

              if (
                refNode &&
                refNode['s-sn'] === nodeToRelocate['s-sn'] &&
                parentNodeRef === ((refNode as d.PatchedSlotNode).__parentNode || refNode.parentNode)
              ) {
                refNode = refNode.nextSibling as d.RenderNode | null;

                // If the refNode is the same node to be relocated or another element's slot reference, keep searching to find the
                // correct relocation target
                while (refNode === nodeToRelocate || refNode?.['s-sr']) {
                  refNode = refNode?.nextSibling as d.RenderNode | null;
                }

                if (!refNode || !refNode['s-nr']) {
                  insertBeforeNode = refNode;
                  break;
                }
              }

              orgLocationNode = orgLocationNode.previousSibling as d.RenderNode | null;
            }
          }

          const parent = (nodeToRelocate as d.PatchedSlotNode).__parentNode || nodeToRelocate.parentNode;
          const nextSibling = (nodeToRelocate as d.PatchedSlotNode).__nextSibling || nodeToRelocate.nextSibling;
          if ((!insertBeforeNode && parentNodeRef !== parent) || nextSibling !== insertBeforeNode) {
            // we've checked that it's worth while to relocate
            // since that the node to relocate
            // has a different next sibling or parent relocated

            if (nodeToRelocate !== insertBeforeNode) {
              if (!BUILD.experimentalSlotFixes && !nodeToRelocate['s-hn'] && nodeToRelocate['s-ol']) {
                // probably a component in the index.html that doesn't have its hostname set
                nodeToRelocate['s-hn'] = nodeToRelocate['s-ol'].parentNode.nodeName;
              }

              // Add it back to the dom but in its new home
              // If we get to this point and `insertBeforeNode` is `null`, that means
              // we're just going to append the node as the last child of the parent. Passing
              // `null` as the second arg here will trigger that behavior.
              insertBefore(parentNodeRef, nodeToRelocate, insertBeforeNode);

              // Reset the `hidden` value back to what it was defined as originally
              // This solves a problem where a `slot` is dynamically rendered and `hidden` may have
              // been set on content originally, but now it has a slot to go to so it should have
              // the value it was defined as having in the DOM, not what we overrode it to.
              if (nodeToRelocate.nodeType === NODE_TYPE.ElementNode && nodeToRelocate.tagName !== 'SLOT-FB') {
                nodeToRelocate.hidden = nodeToRelocate['s-ih'] ?? false;
              }
            }
          }
          nodeToRelocate && typeof slotRefNode['s-rf'] === 'function' && slotRefNode['s-rf'](slotRefNode);
        } else {
          // this node doesn't have a slot home to go to, so let's hide it
          if (nodeToRelocate.nodeType === NODE_TYPE.ElementNode) {
            // Store the initial value of `hidden` so we can reset it later when
            // moving nodes around.
            if (isInitialLoad) {
              nodeToRelocate['s-ih'] = nodeToRelocate.hidden ?? false;
            }

            nodeToRelocate.hidden = true;
          }
        }
      }
    }

    if (checkSlotFallbackVisibility) {
      updateFallbackSlotVisibility(rootVnode.$elm$);
    }

    // done moving nodes around
    // allow the disconnect callback to work again
    plt.$flags$ &= ~PLATFORM_FLAGS.isTmpDisconnected;

    // always reset
    relocateNodes.length = 0;
  }

  // Hide any elements that were projected through, but don't have a slot to go to.
  // Only an issue if there were no "slots" rendered. Otherwise, nodes are hidden correctly.
  // This _only_ happens for `scoped` components!
  if (BUILD.experimentalScopedSlotChanges && cmpMeta.$flags$ & CMP_FLAGS.scopedCssEncapsulation) {
    const children = rootVnode.$elm$.__childNodes || rootVnode.$elm$.childNodes;
    for (const childNode of children) {
      if (childNode['s-hn'] !== hostTagName && !childNode['s-sh']) {
        // Store the initial value of `hidden` so we can reset it later when
        // moving nodes around.
        if (isInitialLoad && childNode['s-ih'] == null) {
          childNode['s-ih'] = childNode.hidden ?? false;
        }

        childNode.hidden = true;
      }
    }
  }

  // Clear the content ref so we don't create a memory leak
  contentRef = undefined;
};

// slot comment debug nodes only created with the `--debug` flag
// otherwise these nodes are text nodes w/out content
const slotReferenceDebugNode = (slotVNode: d.VNode) =>
  win.document?.createComment(
    `<slot${slotVNode.$name$ ? ' name="' + slotVNode.$name$ + '"' : ''}> (host=${hostTagName.toLowerCase()})`,
  );

const originalLocationDebugNode = (nodeToRelocate: d.RenderNode): any =>
  win.document?.createComment(
    `org-location for ` +
      (nodeToRelocate.localName
        ? `<${nodeToRelocate.localName}> (host=${nodeToRelocate['s-hn']})`
        : `[${nodeToRelocate.textContent}]`),
  );
