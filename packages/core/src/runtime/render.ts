import type * as d from '@stencil/core';

import { renderVdom } from './vdom/vdom-render';

/**
 * A WeakMap to persist HostRef objects across multiple render() calls to the
 * same container. This enables VNode diffing on re-renders — without it, each
 * call creates a fresh HostRef with no previous VNode, causing renderVdom to
 * replace the entire DOM subtree instead of patching only what changed.
 */
const hostRefCache = new WeakMap<Element, d.HostRef>();

/**
 * Method to render a virtual DOM tree to a container element.
 *
 * Supports efficient re-renders: calling `render()` again on the same container
 * will diff the new VNode tree against the previous one and only update what changed,
 * preserving existing DOM elements and their state.
 *
 * @example
 * ```tsx
 * import { render } from '@stencil/core';
 *
 * const vnode = (
 *   <div>
 *     <h1>Hello, world!</h1>
 *   </div>
 * );
 * render(vnode, document.body);
 * ```
 *
 * @param vnode - The virtual DOM tree to render
 * @param container - The container element to render the virtual DOM tree to
 */
export function render(vnode: d.VNode, container: Element) {
  let ref = hostRefCache.get(container);

  if (!ref) {
    const cmpMeta: d.ComponentRuntimeMeta = {
      $flags$: 0,
      $tagName$: container.tagName,
    };

    ref = {
      $flags$: 0,
      $cmpMeta$: cmpMeta,
      $hostElement$: container as d.HostElement,
    };

    hostRefCache.set(container, ref);
  }

  renderVdom(ref, vnode);
}
