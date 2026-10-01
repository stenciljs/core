import * as SignalsCore from '@preact/signals-core';

// @preact/signals-core` global deduplication
// for when there's multiple versions of `@preact/signals-core` in the dependency tree.
// wrap in fn to avoid side effect detection
const getCore = (): typeof SignalsCore =>
  ((globalThis as any)[Symbol.for('stencil.preact-signals-core')] ??= SignalsCore);

export const batch: typeof SignalsCore.batch = (fn) => getCore().batch(fn);
export const computed: typeof SignalsCore.computed = (fn, options) =>
  getCore().computed(fn, options);
export const effect: typeof SignalsCore.effect = (fn, options) => getCore().effect(fn, options);
export const untracked: typeof SignalsCore.untracked = (fn) => getCore().untracked(fn);

export function signal<T>(value: T, options?: SignalsCore.SignalOptions<T>): SignalsCore.Signal<T>;
export function signal<T = undefined>(): SignalsCore.Signal<T | undefined>;
export function signal(value?: unknown, options?: SignalsCore.SignalOptions<unknown>) {
  return getCore().signal(value as any, options);
}

export type { ReadonlySignal, Signal } from '@preact/signals-core';
