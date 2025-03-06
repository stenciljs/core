import { BUILD } from '@app-data';
import { plt, win } from '@platform';
import { CMP_FLAGS } from '@utils';

import type * as d from '../declarations';
import { patchSlottedNode } from './dom-extras';
import { createTime } from './profile';
import {
  COMMENT_NODE_ID,
  CONTENT_REF_ID,
  HYDRATE_CHILD_ID,
  HYDRATE_ID,
  NODE_TYPE,
  ORG_LOCATION_ID,
  SLOT_NODE_ID,
  TEXT_NODE_ID,
  VNODE_FLAGS,
} from './runtime-constants';
import { addSlotRelocateNode, patchSlotNode } from './slot-polyfill-utils';
import { newVNode } from './vdom/h';

/**
 * Takes an SSR rendered document, as annotated by 'vdom-annotations.ts' and:
 *
 * 1) Recreate an accurate VDOM which is fed to 'vdom-render.ts'. A failure to do so can cause hydration errors; extra renders, duplicated nodes
 * 2) Add shadowDOM trees to their respective #document-fragment
 * 3) Move forwarded, slotted nodes out of shadowDOMs
 * 4) Add meta nodes to non-shadow DOMs and their 'slotted' nodes
 *
 * @param hostElm The element to hydrate.
 * @param tagName The element's tag name.
 * @param hostId The host ID assigned to the element by the server. e.g. `s-id="1"`
 * @param hostRef The host reference for the element.
 */
export const initializeClientHydrate = (
  hostElm: d.HostElement,
  tagName: string,
  hostId: string,
  hostRef: d.HostRef,
) => {
  const endHydrate = createTime('hydrateClient', tagName);
  const shadowRoot = hostElm.shadowRoot;
  // children placed by SSR within this component but don't necessarily belong to it.
  // We need to keep tabs on them so we can move them to the right place later
  const childRenderNodes: RenderNodeData[] = [];
  // nodes representing a `<slot>` element
  const slotNodes: RenderNodeData[] = [];
  // nodes that have been slotted from outside the component
  const slottedNodes: SlottedNodes[] = [];
  // nodes that make up this component's shadowDOM
  const shadowRootNodes: d.RenderNode[] = BUILD.shadowDom && shadowRoot ? [] : null;
  // The root VNode for this component
  const vnode: d.VNode = newVNode(tagName, null);
  vnode.$elm$ = hostElm;

  let scopeId: string;
  if (BUILD.scoped) {
    const cmpMeta = hostRef.$cmpMeta$;
    if (cmpMeta && cmpMeta.$flags$ & CMP_FLAGS.needsScopedEncapsulation && hostElm['s-sc']) {
      scopeId = hostElm['s-sc'];
      hostElm.classList.add(scopeId + '-h');
    } else if (hostElm['s-sc']) {
      delete hostElm['s-sc'];
    }
  }

  if (win.document && (!plt.$orgLocNodes$ || !plt.$orgLocNodes$.size)) {
    // This is the first pass over of this whole document;
    // does a scrape to construct a 'bare-bones' tree of what elements we have and where content has been moved from
    initializeDocumentHydrate(win.document.body, (plt.$orgLocNodes$ = new Map()));
  }

  hostElm[HYDRATE_ID] = hostId;
  hostElm.removeAttribute(HYDRATE_ID);

  hostRef.$vnode$ = clientHydrate(
    vnode,
    childRenderNodes,
    slotNodes,
    shadowRootNodes,
    hostElm,
    hostElm,
    hostId,
    slottedNodes,
  );

  let crIndex = 0;
  const crLength = childRenderNodes.length;
  let childRenderNode: RenderNodeData;

  // Steps through the child nodes we found.
  // If moved from an original location (by nature of being rendered in SSR markup) we might be able to move it back there now,
  // so slotted nodes don't get added to internal shadowDOMs
  for (crIndex; crIndex < crLength; crIndex++) {
    childRenderNode = childRenderNodes[crIndex];
    const orgLocationId = childRenderNode.$hostId$ + '.' + childRenderNode.$nodeId$;
    // The original location of this node
    const orgLocationNode = plt.$orgLocNodes$.get(orgLocationId);
    const node = childRenderNode.$elm$ as d.RenderNode;

    if (!shadowRoot) {
      node['s-hn'] = tagName.toUpperCase();

      if (childRenderNode.$tag$ === 'slot') {
        // If this is a virtual 'slot', add it's Content-position Reference now.
        // If we don't, `vdom-render.ts` will try to add nodes to it (and because it may be a comment node, it will error)
        node['s-cr'] = hostElm['s-cr'];
      }
    }

    if (childRenderNode.$tag$ === 'slot') {
      childRenderNode.$name$ = childRenderNode.$elm$['s-sn'] || (childRenderNode.$elm$ as any)['name'] || null;
      if (childRenderNode.$children$) {
        childRenderNode.$flags$ |= VNODE_FLAGS.isSlotFallback;

        if (!childRenderNode.$elm$.childNodes.length) {
          // idiosyncrasy with slot fallback nodes during SSR + `serializeShadowRoot: false`:
          // the slot node is created here (in `addSlot()`) via a comment node,
          // but the children aren't moved into it. Let's do that now
          childRenderNode.$children$.forEach((c) => {
            childRenderNode.$elm$.appendChild(c.$elm$);
          });
        }
      } else {
        childRenderNode.$flags$ |= VNODE_FLAGS.isSlotReference;
      }
    }

    if (orgLocationNode && orgLocationNode.isConnected) {
      if (shadowRoot && orgLocationNode['s-en'] === '') {
        // if this node is within a shadowDOM, with an original location home
        // we're safe to move it now
        orgLocationNode.parentNode.insertBefore(node, orgLocationNode.nextSibling);
      }
      // Remove original location / slot reference comment now.
      // we'll handle it via `addSlotRelocateNode` later
      orgLocationNode.parentNode.removeChild(orgLocationNode);

      if (!shadowRoot) {
        // Add the Original Order of this node.
        // We'll use it to make sure slotted nodes get added in the correct order
        node['s-oo'] = parseInt(childRenderNode.$nodeId$);
      }
    }
    // Remove the original location from the map
    plt.$orgLocNodes$.delete(orgLocationId);
  }

  const hosts: d.HostElement[] = [];
  const snLen = slottedNodes.length;
  let snIndex = 0;
  let slotGroup: SlottedNodes;
  let snGroupIdx: number;
  let snGroupLen: number;
  let slottedItem: SlottedNodes[0];

  // Loops through all the slotted nodes we found while stepping through this component.
  // creates slot relocation nodes (non-shadow) or moves nodes to their new home (shadow)
  for (snIndex; snIndex < snLen; snIndex++) {
    slotGroup = slottedNodes[snIndex];

    if (!slotGroup || !slotGroup.length) continue;

    snGroupLen = slotGroup.length;
    snGroupIdx = 0;

    for (snGroupIdx; snGroupIdx < snGroupLen; snGroupIdx++) {
      slottedItem = slotGroup[snGroupIdx];

      if (!hosts[slottedItem.hostId as any]) {
        // Cache this host for other grouped slotted nodes
        hosts[slottedItem.hostId as any] = plt.$orgLocNodes$.get(slottedItem.hostId);
      }
      // This *shouldn't* happen as we collect all the custom elements first in `initializeDocumentHydrate`
      if (!hosts[slottedItem.hostId as any]) continue;

      const hostEle = hosts[slottedItem.hostId as any];

      // This node is either slotted in a non-shadow host, OR *that* host is nested in a non-shadow host
      if (!hostEle.shadowRoot || !shadowRoot) {
        // Try to set an appropriate Content-position Reference (CR) node for this host element

        // Is a CR already set on the host?
        slottedItem.slot['s-cr'] = hostEle['s-cr'];

        if (!slottedItem.slot['s-cr'] && hostEle.shadowRoot) {
          // Host has shadowDOM - just use the host itself as the CR for native slotting
          slottedItem.slot['s-cr'] = hostEle;
        } else {
          // If all else fails - just set the CR as the first child
          // (9/10 if node['s-cr'] hasn't been set, the node will be at the element root)
          slottedItem.slot['s-cr'] = ((hostEle as any).__childNodes || hostEle.childNodes)[0];
        }
        // Create our 'Original Location' node
        addSlotRelocateNode(slottedItem.node, slottedItem.slot, false, slottedItem.node['s-oo']);

        if (BUILD.experimentalSlotFixes) {
          // patch this node for accessors like `nextSibling` (et al)
          patchSlottedNode(slottedItem.node);
        }
      }

      if (hostEle.shadowRoot && slottedItem.node.parentElement !== hostEle) {
        // shadowDOM - move the item to the element root for native slotting
        hostEle.appendChild(slottedItem.node);
      }
    }
  }

  if (BUILD.scoped && scopeId && slotNodes.length) {
    slotNodes.forEach((slot) => {
      // Host is `scoped: true` - add the slotted scoped class to the slot parent
      slot.$elm$.parentElement.classList.add(scopeId + '-s');
    });
  }

  if (BUILD.shadowDom && shadowRoot && !shadowRoot.childNodes.length) {
    // For `scoped` shadowDOM rendering (not DSD);
    // Add all the root nodes in the shadowDOM (a root node can have a whole nested DOM tree)
    let rnIdex = 0;
    const rnLen = shadowRootNodes.length;
    if (rnLen) {
      for (rnIdex; rnIdex < rnLen; rnIdex++) {
        shadowRoot.appendChild(shadowRootNodes[rnIdex]);
      }

      Array.from(hostElm.childNodes).forEach((node) => {
        if (typeof (node as d.RenderNode)['s-sn'] !== 'string') {
          if (node.nodeType === NODE_TYPE.ElementNode && (node as HTMLElement).slot && (node as HTMLElement).hidden) {
            // this is a slotted node that doesn't have a home ... yet.
            // we can safely leave it be, native behavior will mean it's hidden
            (node as HTMLElement).removeAttribute('hidden');
          } else if (
            node.nodeType === NODE_TYPE.CommentNode ||
            (node.nodeType === NODE_TYPE.TextNode && !(node as Text).wholeText.trim())
          ) {
            // During `scoped` shadowDOM rendering, there's a bunch of comment nodes used for positioning / empty text nodes.
            // Let's tidy them up now to stop frameworks complaining about DOM mismatches.
            node.parentNode.removeChild(node);
          }
        }
      });
    }
  }

  plt.$orgLocNodes$.delete(hostElm['s-id']);
  hostRef.$hostElement$ = hostElm;
  endHydrate();
};

/**
 * Recursively constructs the virtual node tree for a host element and its children.
 * The tree is constructed by parsing the annotations set on the nodes by the server (`vdom-annotations.ts`).
 *
 * In addition to constructing the VNode tree, we also track information about the node's descendants:
 * - which are slots
 * - which should exist in the shadow root
 * - which are nodes that should be rendered as children of the parent node
 *
 * @param parentVNode The vNode representing the parent node.
 * @param childRenderNodes An array of all child nodes in the parent's node tree.
 * @param slotNodes An array of all slot nodes in the parent's node tree.
 * @param shadowRootNodes An array of nodes that should be rendered in the shadowDOM of the parent.
 * @param hostElm The parent element.
 * @param node The node to construct the vNode tree for.
 * @param hostId The host ID assigned to the element by the server.
 * @param slottedNodes - nodes that have been slotted
 * @returns - the constructed VNode
 */
const clientHydrate = (
  parentVNode: d.VNode,
  childRenderNodes: RenderNodeData[],
  slotNodes: RenderNodeData[],
  shadowRootNodes: d.RenderNode[],
  hostElm: d.HostElement,
  node: d.RenderNode,
  hostId: string,
  slottedNodes: SlottedNodes[] = [],
) => {
  let childNodeType: string;
  let childIdSplt: string[];
  let childVNode: RenderNodeData;
  let i: number;
  const scopeId = hostElm['s-sc'];

  if (node.nodeType === NODE_TYPE.ElementNode) {
    childNodeType = (node as HTMLElement).getAttribute(HYDRATE_CHILD_ID);
    if (childNodeType) {
      // Node data from the element's attribute:
      // `${hostId}.${nodeId}.${depth}.${index}`
      childIdSplt = childNodeType.split('.');

      if (childIdSplt[0] === hostId || childIdSplt[0] === '0') {
        childVNode = createSimpleVNode({
          $flags$: 0,
          $hostId$: childIdSplt[0],
          $nodeId$: childIdSplt[1],
          $depth$: childIdSplt[2],
          $index$: childIdSplt[3],
          $tag$: node.tagName.toLowerCase(),
          $elm$: node,
          // If we don't add the initial classes to the VNode, the first `vdom-render.ts` patch
          // won't try to reconcile them. Classes set on the node will be blown away.
          $attrs$: { class: node.className || '' },
        });

        childRenderNodes.push(childVNode);
        node.removeAttribute(HYDRATE_CHILD_ID);

        // This is a new child VNode so ensure its parent VNode has the VChildren array
        if (!parentVNode.$children$) {
          parentVNode.$children$ = [];
        }

        if (BUILD.scoped && scopeId) {
          // Host is `scoped: true` - add that flag to the child.
          // It's used in 'set-accessor.ts' to make sure our scoped class is present
          node['s-si'] = scopeId;
          childVNode.$attrs$.class += ' ' + scopeId;
        }

        // Test if this element was 'slotted' or is a 'slot' (with fallback). Recreate node attributes
        const slotName = childVNode.$elm$.getAttribute('s-sn');
        if (typeof slotName === 'string') {
          if (childVNode.$tag$ === 'slot-fb') {
            // This is a slot node. Set it up and find any assigned slotted nodes
            addSlot(
              slotName,
              childIdSplt[2],
              childVNode,
              node,
              parentVNode,
              childRenderNodes,
              slotNodes,
              shadowRootNodes,
              slottedNodes,
            );

            if (BUILD.scoped && scopeId) {
              // Host is `scoped: true` - a slot-fb node
              // never goes through 'set-accessor.ts' so add the class now
              node.classList.add(scopeId);
            }
          }
          childVNode.$elm$['s-sn'] = slotName;
          childVNode.$elm$.removeAttribute('s-sn');
        }
        if (childVNode.$index$ !== undefined) {
          // add our child VNode to a specific index of the VNode's children
          parentVNode.$children$[childVNode.$index$ as any] = childVNode;
        }

        // This is now the new parent VNode for all the next child checks
        parentVNode = childVNode;

        if (shadowRootNodes && childVNode.$depth$ === '0') {
          shadowRootNodes[childVNode.$index$ as any] = childVNode.$elm$;
        }
      }
    }

    if (node.shadowRoot) {
      // Keep drilling down through the shadow root nodes
      for (i = node.shadowRoot.childNodes.length - 1; i >= 0; i--) {
        clientHydrate(
          parentVNode,
          childRenderNodes,
          slotNodes,
          shadowRootNodes,
          hostElm,
          node.shadowRoot.childNodes[i] as any,
          hostId,
          slottedNodes,
        );
      }
    }

    // Recursively drill down, end to start so we can remove nodes
    const nonShadowNodes = node.__childNodes || node.childNodes;
    for (i = nonShadowNodes.length - 1; i >= 0; i--) {
      clientHydrate(
        parentVNode,
        childRenderNodes,
        slotNodes,
        shadowRootNodes,
        hostElm,
        nonShadowNodes[i] as any,
        hostId,
        slottedNodes,
      );
    }
  } else if (node.nodeType === NODE_TYPE.CommentNode) {
    // `${COMMENT_TYPE}.${hostId}.${nodeId}.${depth}.${index}`
    childIdSplt = node.nodeValue.split('.');

    if (childIdSplt[1] === hostId || childIdSplt[1] === '0') {
      // A comment node for either this host OR (if 0) a root component
      childNodeType = childIdSplt[0];

      childVNode = createSimpleVNode({
        $hostId$: childIdSplt[1],
        $nodeId$: childIdSplt[2],
        $depth$: childIdSplt[3],
        $index$: childIdSplt[4] || '0',
        $elm$: node,
        $attrs$: null,
        $children$: null,
        $key$: null,
        $name$: null,
        $tag$: null,
        $text$: null,
      });

      if (childNodeType === TEXT_NODE_ID) {
        childVNode.$elm$ = findCorrespondingNode(node, NODE_TYPE.TextNode) as d.RenderNode;

        if (childVNode.$elm$ && childVNode.$elm$.nodeType === NODE_TYPE.TextNode) {
          childVNode.$text$ = childVNode.$elm$.textContent;
          childRenderNodes.push(childVNode);

          // Remove the text comment since it's no longer needed
          node.remove();

          // Checks to make sure this node actually belongs to this host.
          // If it was slotted from another component, we don't want to add it to this host's VDOM; it can be removed on render reconciliation.
          // We *want* slotting logic to take care of it
          if (hostId === childVNode.$hostId$) {
            if (!parentVNode.$children$) {
              parentVNode.$children$ = [];
            }
            parentVNode.$children$[childVNode.$index$ as any] = childVNode;
          }

          if (shadowRootNodes && childVNode.$depth$ === '0') {
            shadowRootNodes[childVNode.$index$ as any] = childVNode.$elm$;
          }
        }
      } else if (childNodeType === COMMENT_NODE_ID) {
        childVNode.$elm$ = findCorrespondingNode(node, NODE_TYPE.CommentNode) as d.RenderNode;

        if (childVNode.$elm$ && childVNode.$elm$.nodeType === NODE_TYPE.CommentNode) {
          // A non-Stencil comment node
          childRenderNodes.push(childVNode);

          // Remove the comment comment since it's no longer needed
          node.remove();
        }
      } else if (childVNode.$hostId$ === hostId) {
        // This comment node is specifically for this host id

        if (childNodeType === SLOT_NODE_ID) {
          // Comment refers to a slot node:
          // `${SLOT_NODE_ID}.${hostId}.${nodeId}.${depth}.${index}.${slotName}`;

          // Add the slot name
          const slotName = (node['s-sn'] = childIdSplt[5] || '');

          // add the `<slot>` node to the VNode tree and prepare any slotted any child nodes
          addSlot(
            slotName,
            childIdSplt[2],
            childVNode,
            node,
            parentVNode,
            childRenderNodes,
            slotNodes,
            shadowRootNodes,
            slottedNodes,
          );
        } else if (childNodeType === CONTENT_REF_ID) {
          // `${CONTENT_REF_ID}.${hostId}`;
          if (BUILD.shadowDom && shadowRootNodes) {
            // Remove the content ref comment since it's not needed for shadow
            node.remove();
          } else if (BUILD.slotRelocation) {
            hostElm['s-cr'] = node;
            node['s-cn'] = true;
          }
        }
      }
    }
  } else if (parentVNode && parentVNode.$tag$ === 'style') {
    const vnode = newVNode(null, node.textContent) as any;
    vnode.$elm$ = node;
    vnode.$index$ = '0';
    parentVNode.$children$ = [vnode];
  } else {
    if (node.nodeType === NODE_TYPE.TextNode && !(node as unknown as Text).wholeText.trim()) {
      // empty white space is never accounted for from SSR so there's
      // no corresponding comment node giving it a position in the DOM.
      // It therefore gets slotted / clumped together at the end of the host.
      // It's cleaner to remove. Ideally, SSR is rendered with `prettyHtml: false`
      node.remove();
    }
  }

  return parentVNode;
};

/**
 * Recursively locate any comments representing an 'original location' for a node; in a node's children or shadowRoot children.
 * Creates a map of component IDs and 'original location' ID's which are derived from comment nodes placed by 'vdom-annotations.ts'.
 * Each 'original location' relates to a lightDOM node that was moved deeper into the SSR markup. e.g. `<!--o.1-->` maps to `<div c-id="0.1">`
 *
 * @param node The node to search.
 * @param orgLocNodes A map of the original location annotations and the current node being searched.
 */
export const initializeDocumentHydrate = (node: d.RenderNode, orgLocNodes: d.PlatformRuntime['$orgLocNodes$']) => {
  if (node.nodeType === NODE_TYPE.ElementNode) {
    // Add all the loaded component IDs in this document; required to find nodes later when deciding where slotted nodes should live
    const componentId = node[HYDRATE_ID] || node.getAttribute(HYDRATE_ID);
    if (componentId) {
      orgLocNodes.set(componentId, node);
    }

    let i = 0;
    if (node.shadowRoot) {
      for (; i < node.shadowRoot.childNodes.length; i++) {
        initializeDocumentHydrate(node.shadowRoot.childNodes[i] as d.RenderNode, orgLocNodes);
      }
    }
    const nonShadowNodes = node.__childNodes || node.childNodes;
    for (i = 0; i < nonShadowNodes.length; i++) {
      initializeDocumentHydrate(nonShadowNodes[i] as d.RenderNode, orgLocNodes);
    }
  } else if (node.nodeType === NODE_TYPE.CommentNode) {
    const childIdSplt = node.nodeValue.split('.');
    if (childIdSplt[0] === ORG_LOCATION_ID) {
      orgLocNodes.set(childIdSplt[1] + '.' + childIdSplt[2], node);
      node.nodeValue = '';

      // Useful to know if the original location is The root light-dom of a shadow dom component
      node['s-en'] = childIdSplt[3] as any;
    }
  }
};

/**
 * Creates a VNode to add to a hydrated component VDOM
 *
 * @param vnode - a vnode partial which will be augmented
 * @returns an complete vnode
 */
const createSimpleVNode = (vnode: Partial<RenderNodeData>): RenderNodeData => {
  const defaultVNode: RenderNodeData = {
    $flags$: 0,
    $hostId$: null,
    $nodeId$: null,
    $depth$: null,
    $index$: '0',
    $elm$: null,
    $attrs$: null,
    $children$: null,
    $key$: null,
    $name$: null,
    $tag$: null,
    $text$: null,
  };
  return { ...defaultVNode, ...vnode };
};

function addSlot(
  slotName: string,
  slotId: string,
  childVNode: RenderNodeData,
  node: d.RenderNode,
  parentVNode: d.VNode,
  childRenderNodes: RenderNodeData[],
  slotNodes: RenderNodeData[],
  shadowRootNodes: d.RenderNode[],
  slottedNodes: SlottedNodes[],
) {
  node['s-sr'] = true;
  childVNode.$name$ = slotName || null;
  childVNode.$tag$ = 'slot';

  // Find this slots' current host parent (as dictated by the VDOM tree).
  // Important because where it is now in the constructed SSR markup might be different to where to *should* be
  const parentNodeId = parentVNode?.$elm$ ? parentVNode.$elm$['s-id'] || parentVNode.$elm$.getAttribute('s-id') : '';

  if (BUILD.shadowDom && shadowRootNodes && win.document) {
    /* SHADOW */

    // Browser supports shadowRoot and this is a shadow dom component; create an actual slot element
    const slot = (childVNode.$elm$ = win.document.createElement(childVNode.$tag$ as string) as d.RenderNode);

    if (childVNode.$name$) {
      // Add the slot name attribute
      childVNode.$elm$.setAttribute('name', slotName);
    }

    if (parentNodeId && parentNodeId !== childVNode.$hostId$) {
      // Shadow component's slot is placed inside a nested component's shadowDOM; it doesn't belong to this host - it was forwarded by the SSR markup.
      // Insert it in the root of this host; it's lightDOM. It doesn't really matter where in the host root; the component will take care of it.
      parentVNode.$elm$.insertBefore(slot, parentVNode.$elm$.children[0]);
    } else {
      // Insert the new slot element before the slot comment
      node.parentNode.insertBefore(childVNode.$elm$, node);
    }
    addSlottedNodes(slottedNodes, slotId, slotName, node, childVNode.$hostId$);

    // Remove the slot comment since it's not needed for shadow
    node.remove();

    if (childVNode.$depth$ === '0') {
      shadowRootNodes[childVNode.$index$ as any] = childVNode.$elm$;
    }
  } else {
    /* NON-SHADOW */
    const slot = childVNode.$elm$ as d.RenderNode;

    // Test to see if this non-shadow component's mock 'slot' is placed inside a nested component's shadowDOM. If so, it doesn't belong here;
    // it was forwarded by the SSR markup. So we'll insert it into the root of this host; it's lightDOM with accompanying 'slotted' nodes
    const shouldMove = parentNodeId && parentNodeId !== childVNode.$hostId$ && parentVNode.$elm$.shadowRoot;

    // attempt to find any mock slotted nodes which we'll move later
    addSlottedNodes(slottedNodes, slotId, slotName, node, shouldMove ? parentNodeId : childVNode.$hostId$);
    patchSlotNode(node);

    if (shouldMove) {
      // Move slot comment node (to after any other comment nodes)
      parentVNode.$elm$.insertBefore(slot, parentVNode.$elm$.children[0]);
    }
    childRenderNodes.push(childVNode);
  }

  slotNodes.push(childVNode);

  if (!parentVNode.$children$) {
    parentVNode.$children$ = [];
  }
  parentVNode.$children$[childVNode.$index$ as any] = childVNode;
}

/**
 * Adds groups of slotted nodes (grouped by slot ID) to this host element's 'master' array.
 * We'll use this after the host element's VDOM is completely constructed to finally position and add meta required by non-shadow slotted nodes
 *
 * @param slottedNodes - the main host element 'master' array to add to
 * @param slotNodeId - the slot node unique ID
 * @param slotName - the slot node name (can be '')
 * @param slotNode - the slot node
 * @param hostId - the host element id where this node should be slotted
 */
const addSlottedNodes = (
  slottedNodes: SlottedNodes[],
  slotNodeId: string,
  slotName: string,
  slotNode: d.RenderNode,
  hostId: string,
) => {
  let slottedNode = slotNode.nextSibling as d.RenderNode;
  slottedNodes[slotNodeId as any] = slottedNodes[slotNodeId as any] || [];

  // Looking for nodes that match this slot's name,
  // OR are text / comment nodes and the slot is a default slot (no name) - text / comments cannot be direct descendants of *named* slots.
  // Also ignore slot fallback nodes - they're not part of the lightDOM
  while (
    slottedNode &&
    (((slottedNode['getAttribute'] && slottedNode.getAttribute('slot')) || slottedNode['s-sn']) === slotName ||
      (slotName === '' &&
        !slottedNode['s-sn'] &&
        ((slottedNode.nodeType === NODE_TYPE.CommentNode && slottedNode.nodeValue.indexOf('.') !== 1) ||
          slottedNode.nodeType === NODE_TYPE.TextNode)))
  ) {
    slottedNode['s-sn'] = slotName;
    slottedNodes[slotNodeId as any].push({ slot: slotNode, node: slottedNode, hostId });
    slottedNode = slottedNode.nextSibling as d.RenderNode;
  }
};

/**
 * Steps through the node's siblings to find the next node of a specific type, with a value.
 * e.g. when we find a position comment `<!--t.1-->`, we need to find the next text node with a value.
 * (it's a guard against whitespace which is never accounted for in the SSR output)
 * @param node - the starting node
 * @param type - the type of node to find
 * @returns the first corresponding node of the type
 */
const findCorrespondingNode = (node: Node, type: NODE_TYPE.CommentNode | NODE_TYPE.TextNode) => {
  let sibling = node;
  do {
    sibling = sibling.nextSibling;
  } while (sibling && (sibling.nodeType !== type || !sibling.nodeValue));
  return sibling;
};

type SlottedNodes = Array<{ slot: d.RenderNode; node: d.RenderNode; hostId: string }>;

interface RenderNodeData extends d.VNode {
  $hostId$: string;
  $nodeId$: string;
  $depth$: string;
  $index$: string;
  $elm$: d.RenderNode;
}
