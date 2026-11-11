import { win } from 'virtual:platform';
import type * as d from '@stencil/core';

import { HYDRATE_ID, NODE_TYPE } from './runtime-constants';

/**
 * SSR hosts connected while the HTML parser is still inside them (streamed documents),
 * in connection order - which is document order. Each is held until its subtree is
 * parsed so hydration sees its declarative shadow root and children.
 */
const pending = new Set<d.HostElement>();
let observer: MutationObserver | undefined;

const parentOf = (node: Node) =>
  node.parentNode ??
  (node.nodeType === NODE_TYPE.DocumentFragment ? (node as ShadowRoot).host : null);

/**
 * The parser has finished with `elm` once it, or any ancestor, has a following sibling.
 * @param elm the element to check
 * @returns whether the element's subtree is fully parsed
 */
const isParsed = (elm: Node) => {
  if (win.document.readyState !== 'loading') return true;
  for (let n: Node | null = elm; n; n = parentOf(n)) {
    if (n.nextSibling) return true;
  }
  return false;
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
