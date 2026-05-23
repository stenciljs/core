import { effect, signal } from '@preact/signals-core';
import { BUILD } from 'virtual:app-data';
import { consoleError } from 'virtual:platform';
import type * as d from '@stencil/core';

import { HOST_FLAGS, MEMBER_FLAGS, WATCH_FLAGS } from '../utils/constants';
import { scheduleUpdate } from './update-component';

// Explicit `unique symbol` annotation is required so this can be used as a typed property key
export const STENCIL_SIGNALS_SYMBOL: unique symbol = Symbol.for('stencil.signals');

/** Minimal interface for duck-typed signal detection. Cross-bundle-safe (no instanceof). */
export interface SignalLike<T = any> {
  readonly value: T;
  peek(): T;
  subscribe(fn: (v: T) => void): () => void;
}

/**
 * Duck-type check for Signal objects. Cross-bundle-safe (no instanceof).
 * @param v value to test
 * @returns whether `v` implements the SignalLike interface
 */
export const isSignalLike = (v: any): v is SignalLike =>
  v !== null &&
  typeof v === 'object' &&
  typeof v.peek === 'function' &&
  typeof v.subscribe === 'function';

/**
 * Create Signal.State instances for every @Prop/@State member, copy initial
 * values from $instanceValues$, and wire up:
 *  - a per-prop scheduling effect  → calls scheduleUpdate when value changes
 *  - per-prop watcher effects      → call @Watch callbacks with old/new value
 *
 * All dispose functions are collected into hostRef.$signalCleanup$() for
 * teardown on disconnect.
 * @param elm the host element
 * @param hostRef the component's host reference
 * @param cmpMeta the component's runtime metadata
 */
export const initializeSignals = (
  elm: d.HostElement,
  hostRef: d.HostRef,
  cmpMeta: d.ComponentRuntimeMeta,
) => {
  if (hostRef.$signalValues$) return; // already initialized (HMR re-entry guard)

  hostRef.$signalValues$ = new Map();
  const disposers: (() => void)[] = [];
  const instance = BUILD.lazyLoad ? hostRef.$lazyInstance$ : (elm as any);

  for (const [memberName, [memberFlags]] of Object.entries(cmpMeta.$members$ ?? {})) {
    if (!(memberFlags & MEMBER_FLAGS.PropLike)) continue;

    const initialVal = hostRef.$instanceValues$.get(memberName);
    const sig = signal(initialVal);
    hostRef.$signalValues$.set(memberName, sig);

    // Scheduling effect - first synchronous run is a no-op (hasRendered is false)
    let prevScheduleVal = sig.peek();
    disposers.push(
      effect(() => {
        const newVal = sig.value;
        if (hostRef.$flags$ & HOST_FLAGS.hasRendered) {
          if (instance?.componentShouldUpdate) {
            const shouldUpdate = instance.componentShouldUpdate(
              newVal,
              prevScheduleVal,
              memberName,
            );
            if (shouldUpdate === false && !(hostRef.$flags$ & HOST_FLAGS.isQueuedForUpdate)) {
              prevScheduleVal = newVal;
              return;
            }
          }
          if (!(hostRef.$flags$ & HOST_FLAGS.isQueuedForUpdate)) {
            scheduleUpdate(hostRef, false);
          }
        }
        prevScheduleVal = newVal;
      }),
    );

    // Watcher effects
    if (BUILD.propChangeCallback && cmpMeta.$watchers$?.[memberName]) {
      const watchMethods = cmpMeta.$watchers$[memberName];
      let prevWatchVal = sig.peek();
      disposers.push(
        effect(() => {
          const newVal = sig.value;
          const flags = hostRef.$flags$;
          watchMethods.forEach((watcher) => {
            try {
              const [[watchMethodName, watcherFlags]] = Object.entries(watcher);
              if (flags & HOST_FLAGS.isWatchReady || watcherFlags & WATCH_FLAGS.Immediate) {
                const inst = BUILD.lazyLoad ? hostRef.$lazyInstance$ : (elm as any);
                if (inst) {
                  inst[watchMethodName](newVal, prevWatchVal, memberName);
                }
              }
            } catch (e) {
              consoleError(e, elm);
            }
          });
          prevWatchVal = newVal;
        }),
      );
    }
  }

  const effectMethods: string[] = instance?.['__stencilEffects'] ?? [];
  for (const methodName of effectMethods) {
    disposers.push(
      effect(() => {
        try {
          instance[methodName]();
        } catch (e) {
          consoleError(e, elm);
        }
      }),
    );
  }

  // Expose only @Prop signals externally - @State is internal implementation detail
  const publicSignals = new Map(
    [...hostRef.$signalValues$].filter(
      ([k]) => (cmpMeta.$members$?.[k]?.[0] ?? 0) & MEMBER_FLAGS.Prop,
    ),
  );
  (elm as any)[STENCIL_SIGNALS_SYMBOL] = publicSignals;

  hostRef.$signalCleanup$ = () => {
    disposers.forEach((d) => d());
    (elm as any)[STENCIL_SIGNALS_SYMBOL] = undefined;
  };
};

/**
 * Sets up `@Effect()` method subscriptions without full signal-backing.
 * Called when `vdomSignals` is active but `signalBacking` is not - allows
 * reactive effects that track external signals with no @Prop/@State overhead.
 * @param elm the host element
 * @param hostRef the component's host reference
 */
export const initializeEffects = (elm: d.HostElement, hostRef: d.HostRef) => {
  const instance = BUILD.lazyLoad ? hostRef.$lazyInstance$ : (elm as any);
  const effectMethods: string[] = instance?.['__stencilEffects'] ?? [];
  if (!effectMethods.length) return;
  const disposers: (() => void)[] = [];
  for (const methodName of effectMethods) {
    disposers.push(
      effect(() => {
        try {
          instance[methodName]();
        } catch (e) {
          consoleError(e, elm);
        }
      }),
    );
  }
  hostRef.$signalCleanup$ = () => disposers.forEach((d) => d());
};

// re-export from here for easy swap-out
export { effect } from '@preact/signals-core';
