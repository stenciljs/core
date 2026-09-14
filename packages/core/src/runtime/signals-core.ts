import * as SignalsCore from '@preact/signals-core';

// @preact/signals-core` global deduplication
// for when there's multiple versions of `@preact/signals-core` in the dependency tree
const DEDUPE_KEY = Symbol.for('stencil.preact-signals-core');
const core: typeof SignalsCore = ((globalThis as any)[DEDUPE_KEY] ??= SignalsCore);

export const { batch, computed, effect, signal, untracked } = core;
export type { ReadonlySignal, Signal } from '@preact/signals-core';
