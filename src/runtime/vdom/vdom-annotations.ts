import { getHostRef } from '@platform';

import type * as d from '../../declarations';
import {
  COMMENT_NODE_ID,
  CONTENT_REF_ID,
  DEFAULT_DOC_DATA,
  HYDRATE_CHILD_ID,
  HYDRATE_ID,
  NODE_TYPE,
  ORG_LOCATION_ID,
  SLOT_NODE_ID,
  STENCIL_DOC_DATA,
  TEXT_NODE_ID,
} from '../runtime-constants';
import { insertBefore } from './vdom-render';

/**
 * Updates the DOM generated on the server with annotations such as node attributes and
 * comment nodes to facilitate future client-side hydration. These annotations are used for things
 * like moving elements back to their original hosts if using Shadow DOM on the client, and for quickly
 * reconstructing the vNode representations of the DOM.
 *
 * @param doc The DOM generated by the server.
 * @param staticComponents Any components that should be considered static and do not need client-side hydration.
 */
export const insertVdomAnnotations = (doc: Document, staticComponents: string[]) => {
  if (doc != null) {
    /**
     * Initiated `docData` object from the document if it exists to ensure we
     * maintain the same `docData` object across multiple hydration hydration runs.
     */
    const docData: d.DocData = STENCIL_DOC_DATA in doc ? (doc[STENCIL_DOC_DATA] as d.DocData) : { ...DEFAULT_DOC_DATA };
    docData.staticComponents = new Set(staticComponents);
    const orgLocationNodes: d.RenderNode[] = [];

    parseVNodeAnnotations(doc, doc.body, docData, orgLocationNodes);

    orgLocationNodes.forEach((orgLocationNode) => {
      if (orgLocationNode != null && orgLocationNode['s-nr']) {
        const nodeRef = orgLocationNode['s-nr'] as d.RenderNode;

        let hostId = nodeRef['s-host-id'];
        let nodeId = nodeRef['s-node-id'];
        let childId = `${hostId}.${nodeId}`;

        if (hostId == null) {
          hostId = 0;
          docData.rootLevelIds++;
          nodeId = docData.rootLevelIds;
          childId = `${hostId}.${nodeId}`;

          if (nodeRef.nodeType === NODE_TYPE.ElementNode) {
            nodeRef.setAttribute(HYDRATE_CHILD_ID, childId);
            if (typeof nodeRef['s-sn'] === 'string' && !nodeRef.getAttribute('slot')) {
              nodeRef.setAttribute('s-sn', nodeRef['s-sn']);
            }
          } else if (nodeRef.nodeType === NODE_TYPE.TextNode) {
            if (hostId === 0) {
              const textContent = nodeRef.nodeValue?.trim();
              if (textContent === '') {
                // useless whitespace node at the document root
                orgLocationNode.remove();
                return;
              }
            }
            const commentBeforeTextNode = doc.createComment(childId);
            commentBeforeTextNode.nodeValue = `${TEXT_NODE_ID}.${childId}`;
            insertBefore(nodeRef.parentNode, commentBeforeTextNode as any, nodeRef);
          } else if (nodeRef.nodeType === NODE_TYPE.CommentNode) {
            const commentBeforeTextNode = doc.createComment(childId);
            commentBeforeTextNode.nodeValue = `${COMMENT_NODE_ID}.${childId}`;
            nodeRef.parentNode.insertBefore(commentBeforeTextNode, nodeRef);
          }
        }

        let orgLocationNodeId = `${ORG_LOCATION_ID}.${childId}`;

        const orgLocationParentNode = orgLocationNode.parentElement as d.RenderNode;
        if (orgLocationParentNode) {
          if (orgLocationParentNode['s-en'] === '') {
            // ending with a "." means that the parent element
            // of this node's original location is a SHADOW dom element
            // and this node is a part of the root level light dom
            orgLocationNodeId += `.`;
          } else if (orgLocationParentNode['s-en'] === 'c') {
            // ending with a ".c" means that the parent element
            // of this node's original location is a SCOPED element
            // and this node is apart of the root level light dom
            orgLocationNodeId += `.c`;
          }
        }

        orgLocationNode.nodeValue = orgLocationNodeId;
      }
    });
  }
};

/**
 * Recursively parses a node generated by the server and its children to set host and child id
 * attributes read during client-side hydration. This function also tracks whether each node is
 * an original location reference node meaning that a node has been moved via slot relocation.
 *
 * @param doc The DOM generated by the server.
 * @param node The node to parse.
 * @param docData An object containing metadata about the document.
 * @param orgLocationNodes An array of nodes that have been moved via slot relocation.
 */
const parseVNodeAnnotations = (
  doc: Document,
  node: d.RenderNode,
  docData: d.DocData,
  orgLocationNodes: d.RenderNode[],
) => {
  if (node == null) {
    return;
  }

  if (node['s-nr'] != null) {
    orgLocationNodes.push(node);
  }

  if (node.nodeType === NODE_TYPE.ElementNode) {
    /**
     * we need to insert the vnode annotations on the host element children as well
     * as on the children from its shadowRoot if there is one
     */
    const childNodes = [...Array.from(node.childNodes), ...Array.from(node.shadowRoot?.childNodes || [])];
    childNodes.forEach((childNode) => {
      const hostRef = getHostRef(childNode as any);
      if (hostRef != null && !docData.staticComponents.has(childNode.nodeName.toLowerCase())) {
        const cmpData: CmpData = {
          nodeIds: 0,
        };
        insertVNodeAnnotations(doc, childNode as any, hostRef.$vnode$, docData, cmpData);
      }

      parseVNodeAnnotations(doc, childNode as any, docData, orgLocationNodes);
    });
  }
};

/**
 * Insert attribute annotations on an element for its host ID and, potentially, its child ID.
 * Also makes calls to insert annotations on the element's children, keeping track of the depth of
 * the component tree.
 *
 * @param doc The DOM generated by the server.
 * @param hostElm The element to insert annotations for.
 * @param vnode The vNode representation of the element.
 * @param docData An object containing metadata about the document.
 * @param cmpData An object containing metadata about the component.
 */
const insertVNodeAnnotations = (
  doc: Document,
  hostElm: d.HostElement,
  vnode: d.VNode | undefined,
  docData: d.DocData,
  cmpData: CmpData,
) => {
  if (vnode != null) {
    const hostId = ++docData.hostIds;

    hostElm.setAttribute(HYDRATE_ID, hostId as any);

    if (hostElm['s-cr'] != null) {
      hostElm['s-cr'].nodeValue = `${CONTENT_REF_ID}.${hostId}`;
    }

    if (vnode.$children$ != null) {
      const depth = 0;
      vnode.$children$.forEach((vnodeChild, index) => {
        insertChildVNodeAnnotations(doc, vnodeChild, cmpData, hostId, depth, index);
      });
    }

    // If this element does not already have a child ID and has a sibling comment node
    // representing a slot, we use the content of the comment to set the child ID attribute
    // on the host element.
    if (hostElm && vnode && vnode.$elm$ && !hostElm.hasAttribute(HYDRATE_CHILD_ID)) {
      const parent: HTMLElement | null = hostElm.parentElement;
      if (parent && parent.childNodes) {
        const parentChildNodes: ChildNode[] = Array.from(parent.childNodes);
        const comment: d.RenderNode | undefined = parentChildNodes.find(
          (node) => node.nodeType === NODE_TYPE.CommentNode && (node as d.RenderNode)['s-sr'],
        ) as d.RenderNode | undefined;
        if (comment) {
          const index: number = parentChildNodes.indexOf(hostElm) - 1;
          (vnode.$elm$ as d.RenderNode).setAttribute(
            HYDRATE_CHILD_ID,
            `${comment['s-host-id']}.${comment['s-node-id']}.0.${index}`,
          );
        }
      }
    }
  }
};

/**
 * Recursively analyzes the type of a child vNode and inserts annotations on the vNodes's element based on its type.
 * Element nodes receive a child ID attribute, text nodes have a comment with the child ID inserted before them,
 * and comment nodes representing a slot have their node value set to a slot node ID containing the child ID.
 *
 * @param doc The DOM generated by the server.
 * @param vnodeChild The vNode to insert annotations for.
 * @param cmpData An object containing metadata about the component.
 * @param hostId The host ID of this element's parent.
 * @param depth How deep this element sits in the component tree relative to its parent.
 * @param index The index of this element in its parent's children array.
 */
const insertChildVNodeAnnotations = (
  doc: Document,
  vnodeChild: d.VNode,
  cmpData: CmpData,
  hostId: number,
  depth: number,
  index: number,
) => {
  const childElm = vnodeChild.$elm$ as d.RenderNode;
  if (childElm == null) {
    return;
  }

  const nodeId = cmpData.nodeIds++;
  const childId = `${hostId}.${nodeId}.${depth}.${index}`;

  childElm['s-host-id'] = hostId;
  childElm['s-node-id'] = nodeId;

  if (childElm.nodeType === NODE_TYPE.ElementNode) {
    childElm.setAttribute(HYDRATE_CHILD_ID, childId);
    if (typeof childElm['s-sn'] === 'string' && !childElm.getAttribute('slot')) {
      childElm.setAttribute('s-sn', childElm['s-sn']);
    }
  } else if (childElm.nodeType === NODE_TYPE.TextNode) {
    const parentNode = childElm.parentNode;
    const nodeName = parentNode?.nodeName;
    if (nodeName !== 'STYLE' && nodeName !== 'SCRIPT') {
      const textNodeId = `${TEXT_NODE_ID}.${childId}`;

      const commentBeforeTextNode = doc.createComment(textNodeId);
      insertBefore(parentNode, commentBeforeTextNode as any, childElm);
    }
  } else if (childElm.nodeType === NODE_TYPE.CommentNode) {
    if (childElm['s-sr']) {
      const slotName = childElm['s-sn'] || '';
      const slotNodeId = `${SLOT_NODE_ID}.${childId}.${slotName}`;
      childElm.nodeValue = slotNodeId;
    }
  }

  if (vnodeChild.$children$ != null) {
    // Increment depth each time we recur deeper into the tree
    const childDepth = depth + 1;
    vnodeChild.$children$.forEach((vnode, index) => {
      insertChildVNodeAnnotations(doc, vnode, cmpData, hostId, childDepth, index);
    });
  }
};

interface CmpData {
  nodeIds: number;
}
