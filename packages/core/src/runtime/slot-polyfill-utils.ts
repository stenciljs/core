import { BUILD } from 'virtual:app-data';
import type * as d from '@stencil/core';

import { internalCall } from './dom-extras';

/**
 * Get's the child nodes of a component that are actually slotted.
 * It does this by using root nodes of a component; for each slotted node there is a
 * corresponding slot location node which points to the slotted node (via `['s-nr']`).
 *
 * This is only required until all patches are unified / switched on all the time (then we can rely on `childNodes`)
 * either under 'lightDomPatches' or on by default
 * @param childNodes all 'internal' child nodes of the component
 * @returns An array of slotted reference nodes.
 */
export const getSlottedChildNodes = (childNodes: NodeListOf<ChildNode>): d.PatchedSlotNode[] => {
  const result: d.PatchedSlotNode[] = [];
  for (let i = 0; i < childNodes.length; i++) {
    const slottedNode = ((childNodes[i] as d.RenderNode)['s-nr'] as d.PatchedSlotNode) || undefined;
    if (slottedNode && slottedNode.isConnected) {
      result.push(slottedNode);
    }
  }
  return result;
};

/**
 * Finds a slot element within a host element using native DOM query.
 * @param host the host element to search within
 * @param slotName the name of the slot to find, or undefined to get all slots
 * @returns the matching slot node, or null
 */
export function getHostSlotNode(host: Element, slotName?: string): d.RenderNode | null {
  for (const slot of (host as Element).querySelectorAll('slot') as NodeListOf<d.RenderNode>) {
    if (slot['s-sr'] && slot['s-hn'] === (host as HTMLElement).tagName &&
        (slotName === undefined || slot['s-sn'] === slotName)) {
      return slot;
    }
  }
  return null;
}

/**
 * Check whether a node is located in a given named slot.
 *
 * @param nodeToRelocate the node of interest
 * @param slotName the slot name to check
 * @returns whether the node is located in the slot or not
 */
export const isNodeLocatedInSlot = (nodeToRelocate: d.RenderNode, slotName: string): boolean => {
  // fixes nested slot ordering. breaks slot fallback visibility :/
  
  // if (nodeToRelocate['s-sr']) {
  //   // This node is a <slot> element used as light-DOM content of another component.
  //   // Its s-sn holds the slot's own name (what it accepts), not the slot it goes into.
  //   // Use the 'slot' attribute to determine which slot of the parent it targets.
  //   const targetSlot = (nodeToRelocate.nodeType === 1 && (nodeToRelocate as Element).getAttribute('slot')) || '';
  //   return targetSlot === slotName;
  // }
  const nodeName = getSlotName(nodeToRelocate);
  return nodeName !== undefined ? nodeName === slotName : slotName === '';
};

/**
 * Creates an empty text node to act as a forwarding address to a slotted node:
 * 1) When non-shadow components re-render, they need a place to temporarily put 'lightDOM' elements.
 * 2) Patched dom methods and accessors use this node to calculate what 'lightDOM' nodes are in the host.
 *
 * @param newChild a node that's going to be added to the component
 * @param slotNode the slot node that the node will be added to
 * @param prepend move the slotted location node to the beginning of the host
 * @param position an ordered position to add the ref node which mirrors the lightDom nodes' order. Used during SSR hydration
 *  (the order of the slot location nodes determines the order of the slotted nodes in our patched accessors)
 */
export const addSlotRelocateNode = (
  newChild: d.PatchedSlotNode,
  slotNode: d.RenderNode,
  prepend?: boolean,
  position?: number,
) => {
  if (newChild['s-ol'] && newChild['s-ol'].isConnected) {
    // newChild already has a slot location node
    return;
  }

  const slottedNodeLocation = document.createTextNode('') as any;
  slottedNodeLocation['s-nr'] = newChild;

  // if there's no content reference node, or parentNode we can't do anything
  if (!slotNode['s-cr'] || !slotNode['s-cr'].parentNode) return;

  const parent = slotNode['s-cr'].parentNode as any;
  const appendMethod = prepend
    ? internalCall(parent, 'prepend')
    : internalCall(parent, 'appendChild');

  if (BUILD.hydrateClientSide && typeof position !== 'undefined') {
    slottedNodeLocation['s-oo'] = position;
    const childNodes = internalCall(parent, 'childNodes') as NodeListOf<d.RenderNode>;
    const slotRelocateNodes: d.RenderNode[] = [slottedNodeLocation];
    childNodes.forEach((n) => {
      if (n['s-nr']) slotRelocateNodes.push(n);
    });

    slotRelocateNodes.sort((a, b) => {
      if (!a['s-oo'] || a['s-oo'] < (b['s-oo'] || 0)) return -1;
      else if (!b['s-oo'] || b['s-oo'] < a['s-oo']) return 1;
      return 0;
    });
    slotRelocateNodes.forEach((n) => appendMethod.call(parent, n));
  } else {
    appendMethod.call(parent, slottedNodeLocation);
  }

  newChild['s-ol'] = slottedNodeLocation;
  newChild['s-sh'] = slotNode['s-hn'];
};

export const getSlotName = (node: d.PatchedSlotNode) =>
  typeof node['s-sn'] === 'string'
    ? node['s-sn']
    : (node.nodeType === 1 && (node as Element).getAttribute('slot')) || undefined;

/**
 * Add `assignedElements` and `assignedNodes` methods on a `<slot>` element.
 * Content is now physically inside the slot, so these are trivial.
 *
 * @param node - slot node to patch
 */
export function patchSlotNode(node: d.RenderNode) {
  if (!node['s-sr']) return;

  (node as any).assignedNodes = function (opts?: { flatten: boolean }) {
    if (opts?.flatten) {
      if (BUILD.isDev) {
        console.error(
          'Flattening is not supported for Stencil non-shadow slots. You can use `.childNodes` for nested slot fallback content.',
        );
      } else {
        console.error('Flattening not supported for Stencil non-shadow slots');
      }
    }
    return Array.from(this.childNodes);
  }.bind(node);

  (node as any).assignedElements = function (opts?: { flatten: boolean }) {
    if (opts?.flatten) {
      if (BUILD.isDev) {
        console.error(
          'Flattening is not supported for Stencil non-shadow slots. You can use `.childNodes` for nested slot fallback content.',
        );
      } else {
        console.error('Flattening not supported for Stencil non-shadow slots');
      }
    }
    return Array.from(this.children);
  }.bind(node);
}

/**
 * Dispatches a `slotchange` event on a fake `<slot />` node.
 *
 * @param elm the slot node to dispatch the event from
 */
export function dispatchSlotChangeEvent(elm: d.RenderNode) {
  // Only set name for named slots — setting name='' adds a spurious empty attribute on default slots
  if (elm['s-sn']) (elm as any).name = elm['s-sn'];
  elm.dispatchEvent(
    new CustomEvent('slotchange', { bubbles: false, cancelable: false, composed: false }),
  );
}

/**
 * Find the slot node that a slotted node belongs to
 *
 * @param slottedNode - the slotted node to find the slot for
 * @param parentHost - the parent host element of the slotted node
 * @returns the slot node and slot name
 */
export function findSlotFromSlottedNode(slottedNode: d.PatchedSlotNode, parentHost?: HTMLElement) {
  parentHost = parentHost || slottedNode['s-ol']?.parentElement;

  if (!parentHost) return { slotNode: null, slotName: '' };

  const slotName = (slottedNode['s-sn'] = getSlotName(slottedNode) || '');
  const slotNode = getHostSlotNode(parentHost, slotName);
  return { slotNode, slotName };
}
