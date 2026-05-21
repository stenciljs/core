export { batch, computed, effect, signal, untracked } from '@preact/signals-core';
export type { ReadonlySignal, Signal } from '@preact/signals-core';

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
