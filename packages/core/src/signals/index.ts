import { BUILD } from 'virtual:app-data';
import { consoleDevWarn } from 'virtual:platform';

import { STENCIL_SIGNALS_SYMBOL } from '../runtime/signals';
import type { ReadonlySignal } from '../runtime/signals-core';

export { batch, computed, effect, signal, untracked } from '../runtime/signals-core';
export { STENCIL_SIGNALS_SYMBOL };
export type { ReadonlySignal, Signal } from '../runtime/signals-core';

/**
 * Returns the `ReadonlySignal` backing a `@Prop` member on a Stencil element.
 * Requires `signalBacking: true` in `stencil.config.ts`.
 * Only `@Prop` members are exposed - `@State` is internal component state.
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
  // Read the map the runtime publishes on the host, not the host ref: this module is bundled
  // apart from the runtime, and a production build minifies the host ref's property names
  // separately in each, so `hostRef.$signalValues$` isn't the same property here.
  const signals: Map<string, ReadonlySignal<T>> | undefined = (elm as any)[STENCIL_SIGNALS_SYMBOL];
  if (!signals) {
    if (BUILD.isDev) {
      consoleDevWarn(
        `getSignal('${prop}'): element <${elm.tagName.toLowerCase()}> is not signal-backed. ` +
          `Ensure signalBacking is true in stencil.config.ts.`,
      );
    }
    return null;
  }
  // The map only holds `@Prop` members
  return signals.get(prop) ?? null;
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
