import { BUILD } from 'virtual:app-data';
import { consoleDevWarn, getHostRef } from 'virtual:platform';
import type { ReadonlySignal } from '@preact/signals-core';

import { MEMBER_FLAGS } from '../utils/constants';

export { batch, computed, effect, signal, untracked } from '@preact/signals-core';
export { STENCIL_SIGNALS_SYMBOL } from '../runtime/signals';
export type { ReadonlySignal, Signal } from '@preact/signals-core';

/**
 * Returns the `ReadonlySignal` backing a `@Prop` member on a Stencil element.
 * Requires `extras.signalBacking: true` in `stencil.config.ts`.
 * Only `@Prop` members are exposed — `@State` is internal component state.
 *
 * Useful for cross-component or cross-framework reactivity without polling or events:
 * ```ts
 * import { getSignal, computed } from '@stencil/core/signals';
 *
 * const count = getSignal<number>(myEl, 'count');
 * const doubled = computed(() => count.value * 2);
 * ```
 *
 * @param elm - the Stencil host element
 * @param prop - the `@Prop` member name
 * @returns the `ReadonlySignal` for the prop, or `null` if not found / not signal-backed
 */
export const getSignal = <T = unknown>(elm: Element, prop: string): ReadonlySignal<T> | null => {
  const hostRef = getHostRef(elm as any);
  if (!hostRef?.$signalValues$) {
    if (BUILD.isDev) {
      consoleDevWarn(
        `getSignal('${prop}'): element <${elm.tagName.toLowerCase()}> is not signal-backed. ` +
          `Ensure extras.signalBacking is true in stencil.config.ts.`,
      );
    }
    return null;
  }
  const memberFlags = hostRef.$cmpMeta$?.$members$?.[prop]?.[0] ?? 0;
  if (!(memberFlags & MEMBER_FLAGS.Prop)) return null;
  return (hostRef.$signalValues$.get(prop) as ReadonlySignal<T>) ?? null;
};

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
