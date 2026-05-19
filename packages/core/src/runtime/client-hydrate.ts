import { BUILD } from 'virtual:app-data';
import { getHostRef, plt, transformTag, win } from 'virtual:platform';
import type * as d from '@stencil/core';

import { CMP_FLAGS } from '../utils/constants';
import { patchSlottedNode } from './dom-extras';
import { getShadowRoot } from './element';
import { createTime } from './profile';
import {
  COMMENT_NODE_ID,
  CONTENT_REF_ID,
  HYDRATE_CHILD_ID,
  HYDRATE_ID,
  NODE_TYPE,
  ORG_LOCATION_ID,
  TEXT_NODE_ID,
} from './runtime-constants';
import { addSlotRelocateNode, patchSlotNode } from './slot-polyfill-utils';
import { getScopeId } from './styles';
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
  // Use getShadowRoot to handle both open and closed shadow roots
  const shadowRoot = getShadowRoot(hostElm);
  // children placed by SSR within this component but don't necessarily belong to it.
  // We need to keep tabs on them so we can move them to the right place later
  const childRenderNodes: RenderNodeData[] = [];
  // nodes representing a `<slot>` element
  const slotNodes: RenderNodeData[] = [];
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
      node['s-hn'] = transformTag(tagName).toUpperCase();

      if (childRenderNode.$tag$ === 'slot') {
        // If this is a virtual 'slot', add it's Content-position Reference now.
        // If we don't, `vdom-render.ts` will try to add nodes to it (and because it may be a comment node, it will error)
        node['s-cr'] = hostElm['s-cr'];
      }
    } else if (
      childRenderNode.$tag$?.toString().includes('-') &&
      childRenderNode.$tag$ !== 'slot-fb' &&
      !childRenderNode.$elm$.shadowRoot
    ) {
      // if this child is a non-shadow component being added to a shadowDOM,
      // let's find and add its styles to the shadowRoot, so we don't get a visual flicker
      const cmpMeta = getHostRef(childRenderNode.$elm$);
      if (cmpMeta) {
        const childScopeId = getScopeId(
          cmpMeta.$cmpMeta$,
          BUILD.mode ? childRenderNode.$elm$.getAttribute('s-mode') : undefined,
        );
        const styleSheet = win.document.querySelector(`style[sty-id="${childScopeId}"]`);

        if (styleSheet) {
          shadowRootNodes.unshift(styleSheet.cloneNode(true) as d.RenderNode);
        }
      }
    }

    if (childRenderNode.$tag$ === 'slot') {
      childRenderNode.$name$ = (node as HTMLSlotElement).name || null;
      if (!shadowRoot) {
        node['s-sr'] = true;
        node['s-sn'] = (node as HTMLSlotElement).name || '';
        node['s-cr'] = hostElm['s-cr'];
        patchSlotNode(node);
        slotNodes.push(childRenderNode);
      }
    } else if (childRenderNode.$tag$ === 'slot-fb') {
      node['s-sn'] = node.getAttribute('name') || '';
    }

    if (orgLocationNode && orgLocationNode.isConnected) {
      const orgParentNode = orgLocationNode.parentNode;
      if (orgLocationNode.parentElement.shadowRoot && orgLocationNode['s-en'] === '') {
        // if this node is within a shadowDOM, with an original location home
        // we're safe to move it now
        orgParentNode.insertBefore(node, orgLocationNode.nextSibling);
      }
      // Remove original location / slot reference comment now.
      // we'll handle it via `addSlotRelocateNode` later
      orgParentNode.removeChild(orgLocationNode);

      if (!shadowRoot) {
        // Add the Original Order of this node.
        // We'll use it to make sure slotted nodes get added in the correct order
        node['s-oo'] = parseInt(childRenderNode.$nodeId$);
      }
    }
    // Remove the original location from the map
    if (orgLocationNode && !orgLocationNode['s-id']) {
      plt.$orgLocNodes$.delete(orgLocationId);
    }
  }

  // For non-shadow: set s-sn on slotted content and create s-ol markers from <slot> children.
  // Text-position comments (<!--t.H.N.D.I-->) are cleaned up during the parent's clientHydrate pass.
  if (BUILD.slotRelocation && !shadowRoot && slotNodes.length) {
    let currentPos = 0;
    slotNodes.forEach((slotVNode) => {
      const slotElm = slotVNode.$elm$ as d.RenderNode;
      Array.from(slotElm.childNodes).forEach((child) => {
        const childNode = child as d.RenderNode;
        childNode['s-sn'] = slotElm['s-sn'];
        childNode['s-hn'] = transformTag(tagName).toUpperCase();
        if (
          BUILD.lightDomPatches ||
          BUILD.slotChildNodes ||
          (BUILD.patchAll && hostRef.$cmpMeta$.$flags$ & CMP_FLAGS.patchAll)
        ) {
          patchSlottedNode(childNode);
        }
        // Use s-oo (original order from nodeId) so cross-slot document order is preserved
        const pos = childNode['s-oo'] ?? currentPos;
        addSlotRelocateNode(childNode, slotElm, false, pos);
        currentPos = pos + 1;
      });
    });
  }

  if (BUILD.scoped && scopeId && slotNodes.length) {
    slotNodes.forEach((slot) => {
      // <slot> is now the direct parent of slotted nodes — add '-s' here
      slot.$elm$.classList.add(scopeId + '-s');
    });
  }

  if (BUILD.shadowDom && shadowRoot && !shadowRoot.childNodes.length) {
    // For `scoped` shadowDOM rendering (not DSD);
    // Add all the root nodes in the shadowDOM (a root node can have a whole nested DOM tree)
    let rnIdex = 0;
    const rnLen = shadowRootNodes.length;
    if (rnLen) {
      for (rnIdex; rnIdex < rnLen; rnIdex++) {
        const node = shadowRootNodes[rnIdex];

        /**
         * in apps with a lot of components the `shadowRootNodes` array can be modified while iterating over it
         * so we need to check if the node is still in the array before appending it to avoid any errors like:
         *
         *   TypeError: Failed to execute 'appendChild' on 'Node': parameter 1 is not of type 'Node'
         */
        if (node) {
          shadowRoot.appendChild(node);
        }
      }

      Array.from(hostElm.childNodes).forEach((node) => {
        // don't remove slotted or original location nodes
        if (
          typeof (node as d.RenderNode)['s-en'] !== 'string' &&
          typeof (node as d.RenderNode)['s-sn'] !== 'string'
        ) {
          if (
            node.nodeType === NODE_TYPE.ElementNode &&
            (node as HTMLElement).slot &&
            (node as HTMLElement).hidden
          ) {
            // this is a slotted node that doesn't have a home ... yet.
            // we can safely leave it be, native behavior will mean it's hidden
            (node as HTMLElement).removeAttribute('hidden');
          } else if (node.nodeType === NODE_TYPE.CommentNode && !node.nodeValue) {
            // During `scoped` shadowDOM rendering, there's a bunch of comment nodes used for positioning / empty text nodes.
            // Let's tidy them up now to stop frameworks complaining about DOM mismatches.
            node.parentNode.removeChild(node);
          }
        }
      });
    }
  }

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

        if (BUILD.scoped && scopeId && childIdSplt[0] === hostId) {
          // Host is `scoped: true` - add that flag to the child.
          // It's used in 'set-accessor.ts' to make sure our scoped class is present
          node['s-si'] = scopeId;
          childVNode.$attrs$.class += ' ' + scopeId;
        }

        // Test if this element was 'slotted' or is a 'slot' (with fallback). Recreate node attributes
        if (childVNode.$tag$ === 'slot-fb' && BUILD.scoped && scopeId) {
          node.classList.add(scopeId);
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

        if (childNodeType === CONTENT_REF_ID) {
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
const initializeDocumentHydrate = (
  node: d.RenderNode,
  orgLocNodes: d.PlatformRuntime['$orgLocNodes$'],
) => {
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
const createSimpleVNode = (vnode: Partial<RenderNodeData>): RenderNodeData =>
  ({ $flags$: 0, $index$: '0', ...vnode }) as RenderNodeData;

/**
 * Steps through the node's siblings to find the next node of a specific type, with a value.
 * e.g. when we find a position comment `<!--t.1-->`, we need to find the next text node with a value.
 * (it's a guard against whitespace which is never accounted for in the SSR output)
 * @param node - the starting node
 * @param type - the type of node to find
 * @returns the first corresponding node of the type
 */
const findCorrespondingNode = (
  node: Node,
  type: typeof NODE_TYPE.CommentNode | typeof NODE_TYPE.TextNode,
) => {
  let sibling = node;
  do {
    sibling = sibling.nextSibling;
  } while (sibling && (sibling.nodeType !== type || !sibling.nodeValue));
  return sibling;
};

interface RenderNodeData extends d.VNode {
  $hostId$: string;
  $nodeId$: string;
  $depth$: string;
  $index$: string;
  $elm$: d.RenderNode;
}
