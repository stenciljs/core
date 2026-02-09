import type * as d from '@stencil/core';
import { renderVdom } from './vdom/vdom-render';

/**
 * Method to render a virtual DOM tree to a container element.
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
  const cmpMeta: d.ComponentRuntimeMeta = {
    $flags$: 0,
    $tagName$: container.tagName,
  };

  const ref: d.HostRef = {
    $flags$: 0,
    $cmpMeta$: cmpMeta,
    $hostElement$: container as d.HostElement,
  };

  renderVdom(ref, vnode);
}
