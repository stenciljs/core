import { Signal } from '@preact/signals-core';

export { batch, computed, effect, signal, untracked } from '@preact/signals-core';
export type { ReadonlySignal, Signal } from '@preact/signals-core';

import { SHOW_TAG } from '../runtime/runtime-constants';
import type { VNode } from '../declarations/stencil-public-runtime';

/**
 * Marks a class method as a reactive effect. Wraps the method in `effect()` after
 * signal initialization and registers cleanup on disconnect. Dependencies are
 * auto-tracked - any signal read inside re-runs the method on change.
 *
 * @example
 * ```ts
 * import { Effect } from '@stencil/core/signals';
 *
 * @Component({ tag: 'my-cmp' })
 * export class MyCmp {
 *   @State() count = 0;
 *
 *   @Effect()
 *   log() {
 *     console.log(this.count); // re-runs whenever count changes
 *   }
 * }
 * ```
 * @returns a MethodDecorator that registers the method as a reactive effect
 */
export function Effect(): MethodDecorator {
  return (target, propertyKey) => {
    const proto = target as any;
    (proto.__stencilEffects ??= []).push(propertyKey);
  };
}

/**
 * Signal-conditional rendering. When `when` is a `Signal<boolean>`, the children
 * are shown/hidden by toggling `display:contents`/`display:none` on a `<s-show>`
 * wrapper - no component re-render required. When `when` is a plain boolean, behaves
 * like a static conditional (renders children or nothing).
 *
 * Requires `vdomSignals: true` (or `signalBacking: true`) in `stencil.config.ts`.
 *
 * @example
 * ```tsx
 * import { Show, signal } from '@stencil/core/signals';
 *
 * const isLoggedIn = signal(false);
 *
 * render() {
 *   return (
 *     <Show when={isLoggedIn}>
 *       <span>Welcome back</span>
 *     </Show>
 *   );
 * }
 * ```
 * @param props component props — `when` controls visibility
 * @param children child VNodes to show or hide
 * @returns a sentinel VNode for signal-driven visibility, or the children/null for static booleans
 */
export const Show = (
  props: { when: import('@preact/signals-core').ReadonlySignal<boolean> | boolean },
  children: VNode[],
): any => {
  const { when } = props;
  if (!(when instanceof Signal)) {
    return when ? children : null;
  }
  // Return a Show sentinel VNode - createElm handles it specially
  const vnode: VNode = {
    $flags$: 0,
    $tag$: SHOW_TAG,
    $elm$: null,
    $text$: null,
    $children$: children,
    $signal$: when,
  };
  return vnode;
};
