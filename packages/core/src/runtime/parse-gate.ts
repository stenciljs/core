import { win } from 'virtual:platform';
import type * as d from '@stencil/core';

import { HOST_END_ID, HYDRATE_ID, NODE_TYPE } from './runtime-constants';

/**
 * SSR hosts connected while the HTML parser is still inside them (streamed documents),
 * in connection order - which is document order. Each is held until its subtree is
 * parsed so hydration sees its declarative shadow root and children.
 */
const pending = new Set<d.HostElement>();
/** SSR hosts seen parsed: hydration may since have moved or removed their end marker */
const parsedHosts = new WeakSet<Element>();
let observer: MutationObserver | undefined;

const parentOf = (node: Node) =>
  node.parentNode ??
  (node.nodeType === NODE_TYPE.DocumentFragment ? (node as ShadowRoot).host : null);

/**
 * The server writes a `HOST_END_ID` comment as an SSR host's last child, so the parser has
 * finished with the host once it's there (only whitespace, e.g. from `prettyHtml`, may follow -
 * as a single text node, since the parser merges adjacent text).
 * Hosts without one (e.g. from an older server) are held until the document has loaded.
 * @param elm the SSR host
 * @returns whether the host's subtree is fully parsed
 */
const isParsed = (elm: Element) => {
  if (parsedHosts.has(elm) || win.document.readyState !== 'loading') return true;
  let n = elm.lastChild;
  if (n?.nodeType === NODE_TYPE.TextNode) n = n.previousSibling;
  return (
    n?.nodeType === NODE_TYPE.CommentNode &&
    n.nodeValue === `${HOST_END_ID}.${elm.getAttribute(HYDRATE_ID)}` &&
    !!parsedHosts.add(elm)
  );
};

const hasPendingAncestor = (elm: Node) => {
  for (let n = parentOf(elm); n; n = parentOf(n)) {
    if (pending.has(n as d.HostElement)) return true;
  }
  return false;
};

const flush = () => {
  // every parsed host gets its shadow root before any is released, so a released
  // ancestor sees its descendants' roots
  for (const elm of pending) {
    if (!elm.isConnected) pending.delete(elm);
    else if (isParsed(elm)) elm.__attachShadow?.();
  }
  // ancestors are released before descendants, so hydration runs parent-first
  // just as it does for a fully parsed document
  for (const elm of pending) {
    if (isParsed(elm) && !hasPendingAncestor(elm)) {
      pending.delete(elm);
      elm.connectedCallback?.();
    }
  }
  if (!pending.size) {
    observer?.disconnect();
    observer = undefined;
  }
};

/**
 * Whether the parser may still be adding children (including a declarative shadow root)
 * to `elm`: it was just created by the parser, or it's an SSR host the parser is still inside.
 * @param elm the host element
 * @returns `true` if the element's subtree may be incomplete
 */
export const mayStillBeParsing = (elm: HTMLElement) =>
  win.document?.readyState === 'loading' &&
  (!elm.parentNode || (elm.hasAttribute(HYDRATE_ID) && !isParsed(elm)));

/**
 * Holds back `elm`'s `connectedCallback` while it's an SSR host the parser hasn't finished
 * with, or one nested inside such a host. Its shadow root is attached once its own subtree
 * is parsed; `connectedCallback` is re-called once no ancestor host is still held.
 * @param elm the host element being connected
 * @returns `true` if processing was deferred
 */
export const deferUntilParsed = (elm: d.HostElement) => {
  if (pending.has(elm)) return true;
  if (!win.document || !elm.hasAttribute(HYDRATE_ID)) return false;

  const parsed = isParsed(elm);
  if (parsed && !hasPendingAncestor(elm)) return false;
  if (parsed) elm.__attachShadow?.();

  pending.add(elm);
  if (!observer) {
    observer = new MutationObserver(flush);
    observer.observe(win.document, { childList: true, subtree: true });
    win.document.addEventListener('DOMContentLoaded', flush, { once: true });
  }
  return true;
};
