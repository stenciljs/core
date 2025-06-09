import { BUILD } from '@app-data';

import type * as d from '../declarations';
import { internalCall } from './dom-extras';
import { NODE_TYPE } from './runtime-constants';

/**
 * Adjust the `.hidden` property as-needed on any nodes in a DOM subtree which
 * are slot fallback nodes - `<slot-fb>...</slot-fb>`
 *
 * A slot fallback node should be visible by default. Then, it should be
 * conditionally hidden if:
 *
 * - it has a sibling with a `slot` property set to its slot name or if
 * - it is a default fallback slot node, in which case we hide if it has any
 *   content
 *
 * @param elm the element of interest
 */
export const updateFallbackSlotVisibility = (elm: d.RenderNode) => {
  const childNodes = internalCall(elm, 'childNodes');

  // is this is a stencil component?
  if (elm.tagName && elm.tagName.includes('-') && elm['s-cr'] && elm.tagName !== 'SLOT-FB') {
    // stencil component - try to find any slot fallback nodes
    getHostSlotNodes(childNodes as any, (elm as HTMLElement).tagName).forEach((slotNode) => {
      if (slotNode.nodeType === NODE_TYPE.ElementNode && slotNode.tagName === 'SLOT-FB') {
        // this is a slot fallback node
        if (getSlotChildSiblings(slotNode, getSlotName(slotNode), false).length) {
          // has slotted nodes, hide fallback
          slotNode.hidden = true;
        } else {
          // no slotted nodes
          slotNode.hidden = false;
        }
      }
    });
  }

  let i = 0;
  for (i = 0; i < childNodes.length; i++) {
    const childNode = childNodes[i] as d.RenderNode;
    if (childNode.nodeType === NODE_TYPE.ElementNode && internalCall(childNode, 'childNodes').length) {
      // keep drilling down
      updateFallbackSlotVisibility(childNode);
    }
  }
};

/**
 * Get's the child nodes of a component that are actually slotted.
 * It does this by using root nodes of a component; for each slotted node there is a
 * corresponding slot location node which points to the slotted node (via `['s-nr']`).
 *
 * This is only required until all patches are unified / switched on all the time (then we can rely on `childNodes`)
 * either under 'experimentalSlotFixes' or on by default
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
 * Recursively searches a series of child nodes for slot node/s, optionally with a provided slot name.
 * @param childNodes the nodes to search for a slot with a specific name. Should be an element's root nodes.
 * @param hostName the host name of the slot to match on.
 * @param slotName the name of the slot to match on.
 * @returns a reference to the slot node that matches the provided name, `null` otherwise
 */
export function getHostSlotNodes(childNodes: NodeListOf<ChildNode>, hostName?: string, slotName?: string) {
  let i = 0;
  let slottedNodes: d.RenderNode[] = [];
  let childNode: d.RenderNode;

  for (; i < childNodes.length; i++) {
    childNode = childNodes[i] as any;
    if (
      childNode['s-sr'] &&
      (!hostName || childNode['s-hn'] === hostName) &&
      (slotName === undefined || getSlotName(childNode) === slotName)
    ) {
      slottedNodes.push(childNode);
      if (typeof slotName !== 'undefined') return slottedNodes;
    }
    slottedNodes = [...slottedNodes, ...getHostSlotNodes(childNode.childNodes, hostName, slotName)];
  }
  return slottedNodes;
}

/**
 * Get all 'child' sibling nodes of a slot node
 * @param slot - the slot node to get the child nodes from
 * @param slotName - the name of the slot to match on
 * @param includeSlot - whether to include the slot node in the result
 * @returns child nodes of the slot node
 */
export const getSlotChildSiblings = (slot: d.RenderNode, slotName: string, includeSlot = true) => {
  const childNodes: d.RenderNode[] = [];
  if ((includeSlot && slot['s-sr']) || !slot['s-sr']) childNodes.push(slot as any);
  let node = slot;

  while ((node = node.nextSibling as any)) {
    if (getSlotName(node) === slotName && (includeSlot || !node['s-sr'])) childNodes.push(node as any);
  }
  return childNodes;
};

/**
 * Check whether a node is located in a given named slot.
 *
 * @param nodeToRelocate the node of interest
 * @param slotName the slot name to check
 * @returns whether the node is located in the slot or not
 */
export const isNodeLocatedInSlot = (nodeToRelocate: d.RenderNode, slotName: string): boolean => {
  if (nodeToRelocate.nodeType === NODE_TYPE.ElementNode) {
    if (nodeToRelocate.getAttribute('slot') === null && slotName === '') {
      // if the node doesn't have a slot attribute, and the slot we're checking
      // is not a named slot, then we assume the node should be within the slot
      return true;
    }
    if (nodeToRelocate.getAttribute('slot') === slotName) {
      return true;
    }
    return false;
  }
  if (nodeToRelocate['s-sn'] === slotName) {
    return true;
  }
  return slotName === '';
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
  const appendMethod = prepend ? internalCall(parent, 'prepend') : internalCall(parent, 'appendChild');

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
 * Add `assignedElements` and `assignedNodes` methods on a fake slot node
 *
 * @param node - slot node to patch
 */
export function patchSlotNode(node: d.RenderNode) {
  if ((node as any).assignedElements || (node as any).assignedNodes || !node['s-sr']) return;

  const assignedFactory = (elementsOnly: boolean) =>
    function (opts?: { flatten: boolean }) {
      const toReturn: d.RenderNode[] = [];
      const slotName = this['s-sn'];

      if (opts?.flatten) {
        console.error(`
          Flattening is not supported for Stencil non-shadow slots. 
          You can use \`.childNodes\` to nested slot fallback content.
          If you have a particular use case, please open an issue on the Stencil repo.
        `);
      }

      const parent = this['s-cr'].parentElement as d.RenderNode;
      // get all light dom nodes
      const slottedNodes = parent.__childNodes ? parent.childNodes : getSlottedChildNodes(parent.childNodes);

      (slottedNodes as d.RenderNode[]).forEach((n) => {
        // find all the nodes assigned to slots we care about
        if (slotName === getSlotName(n)) {
          toReturn.push(n);
        }
      });

      if (elementsOnly) {
        return toReturn.filter((n) => n.nodeType === NODE_TYPE.ElementNode);
      }
      return toReturn;
    }.bind(node);

  (node as any).assignedElements = assignedFactory(true);
  (node as any).assignedNodes = assignedFactory(false);
}

/**
 * Dispatches a `slotchange` event on a fake `<slot />` node.
 *
 * @param elm the slot node to dispatch the event from
 */
export function dispatchSlotChangeEvent(elm: d.RenderNode) {
  elm.dispatchEvent(new CustomEvent('slotchange', { bubbles: false, cancelable: false, composed: false }));
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
  const childNodes = internalCall(parentHost, 'childNodes');
  const slotNode = getHostSlotNodes(childNodes, parentHost.tagName, slotName)[0];
  return { slotNode, slotName };
}
