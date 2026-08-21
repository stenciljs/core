// @vitest-environment stencil

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from '@stencil/vitest';
import { getHostRef, registerInstance, win } from 'virtual:platform';
// @ts-expect-error - flushAll, flushLoadModule, registerModule, resetPlatform are only exported from the test bundle
import { flushAll, flushLoadModule, registerModule, resetPlatform } from 'virtual:platform';
import type { LazyBundlesRuntimeData } from '@stencil/core/compiler';

import { HOST_FLAGS } from '../../utils';
import { bootstrapLazy } from '../bootstrap-loader';
import { LAZY_LOAD_RETRY_INTERVAL_MS, MAX_LAZY_LOAD_RETRIES } from '../runtime-constants';

describe('lazy-load failure recovery', () => {
  const bundleId = 'cmp-retry-bundle';
  let lazyBundles: LazyBundlesRuntimeData;
  let timeoutSpy: MockInstance<typeof setTimeout>;

  beforeEach(() => {
    resetPlatform();
    lazyBundles = [[bundleId, [[0, 'cmp-retry', {}]]]];
    timeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation(((cb: () => void) => {
      cb();
      return 0 as any;
    }) as any);
  });

  afterEach(() => {
    timeoutSpy.mockRestore();
  });

  it('clears HOST_FLAGS.hasInitializedComponent when the lazy module fails to load', async () => {
    bootstrapLazy(lazyBundles);

    const elm = win.document.createElement('cmp-retry');
    win.document.body.appendChild(elm);

    // No `registerModule(bundleId, ...)` call was made, so the testing
    // platform's `loadModule()` resolves to `undefined` here -- simulating a
    // failed dynamic import() of the real `*.entry.js` chunk.
    await flushLoadModule(bundleId);
    await flushAll().catch(() => {
      /* initializeComponent's internal catch already logs/handles this */
    });

    const hostRef = getHostRef(elm);
    expect(hostRef?.$lazyInstance$).toBeUndefined();
    expect((hostRef?.$flags$ ?? 0) & HOST_FLAGS.hasInitializedComponent).toBe(0);
    // A retry is still available, so the failure should be marked as recoverable.
    expect((hostRef?.$flags$ ?? 0) & HOST_FLAGS.hasFailedLoad).toBe(HOST_FLAGS.hasFailedLoad);
  });

  it('retries initialization when the host element is reconnected after a failed load, backing off by LAZY_LOAD_RETRY_INTERVAL_MS', async () => {
    bootstrapLazy(lazyBundles);

    const elm = win.document.createElement('cmp-retry');
    win.document.body.appendChild(elm);

    // First attempt fails (module never registered).
    await flushLoadModule(bundleId);
    await flushAll().catch(() => {});

    expect(getHostRef(elm)?.$lazyInstance$).toBeUndefined();

    // "Network recovers": the module becomes available, then the element is
    // reconnected (disconnect + reconnect is the retry trigger).
    class CmpRetry {
      constructor(hostRef: any) {
        registerInstance(this, hostRef);
      }
      render() {
        return null;
      }
    }
    registerModule(bundleId, CmpRetry as any);

    elm.remove();
    win.document.body.appendChild(elm);

    // The retry should be scheduled with the standard backoff delay.
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), LAZY_LOAD_RETRY_INTERVAL_MS);

    await flushLoadModule(bundleId);
    await flushAll().catch(() => {});

    const hostRef = getHostRef(elm);
    expect(hostRef?.$lazyInstance$).toBeInstanceOf(CmpRetry);
    expect((hostRef?.$flags$ ?? 0) & HOST_FLAGS.hasInitializedComponent).toBe(
      HOST_FLAGS.hasInitializedComponent,
    );
  });

  it(`gives up after ${MAX_LAZY_LOAD_RETRIES} failed attempts and stops retrying on further reconnects`, async () => {
    bootstrapLazy(lazyBundles);

    const elm = win.document.createElement('cmp-retry');
    win.document.body.appendChild(elm);

    // First attempt (module never registered, so every attempt fails).
    await flushLoadModule(bundleId);
    await flushAll().catch(() => {});

    // Reconnect enough times to exhaust the remaining retries.
    for (let attempt = 1; attempt < MAX_LAZY_LOAD_RETRIES; attempt++) {
      expect((getHostRef(elm)?.$flags$ ?? 0) & HOST_FLAGS.hasFailedLoad).toBe(
        HOST_FLAGS.hasFailedLoad,
      );
      elm.remove();
      win.document.body.appendChild(elm);
      await flushLoadModule(bundleId);
      await flushAll().catch(() => {});
    }

    const hostRef = getHostRef(elm);
    // Retries are exhausted: no more attempts should be scheduled going forward.
    expect((hostRef?.$flags$ ?? 0) & HOST_FLAGS.hasFailedLoad).toBe(0);

    // A further reconnect should NOT queue another load attempt.
    const callsBeforeFinalReconnect = timeoutSpy.mock.calls.length;
    elm.remove();
    win.document.body.appendChild(elm);
    await flushAll().catch(() => {});

    expect(timeoutSpy.mock.calls.length).toBe(callsBeforeFinalReconnect);
    expect(getHostRef(elm)?.$lazyInstance$).toBeUndefined();
  });

  it('does not resolve componentOnReady() while a retry is still pending, and resolves once the retry succeeds', async () => {
    bootstrapLazy(lazyBundles);

    const elm: any = win.document.createElement('cmp-retry');
    win.document.body.appendChild(elm);

    let resolved = false;
    elm.componentOnReady().then(() => {
      resolved = true;
    });

    // First attempt fails -- a retry is still available, so callers awaiting
    // componentOnReady() should NOT be notified with the un-hydrated element yet.
    await flushLoadModule(bundleId);
    await flushAll().catch(() => {});
    expect(resolved).toBe(false);

    class CmpRetry {
      constructor(hostRef: any) {
        registerInstance(this, hostRef);
      }
      render() {
        return null;
      }
    }
    registerModule(bundleId, CmpRetry as any);

    elm.remove();
    win.document.body.appendChild(elm);
    await flushLoadModule(bundleId);
    await flushAll().catch(() => {});

    expect(resolved).toBe(true);
  });

  it(`resolves componentOnReady() once retries are exhausted after ${MAX_LAZY_LOAD_RETRIES} failed attempts`, async () => {
    bootstrapLazy(lazyBundles);

    const elm: any = win.document.createElement('cmp-retry');
    win.document.body.appendChild(elm);

    let resolved = false;
    elm.componentOnReady().then(() => {
      resolved = true;
    });

    await flushLoadModule(bundleId);
    await flushAll().catch(() => {});

    for (let attempt = 1; attempt < MAX_LAZY_LOAD_RETRIES; attempt++) {
      expect(resolved).toBe(false);
      elm.remove();
      win.document.body.appendChild(elm);
      await flushLoadModule(bundleId);
      await flushAll().catch(() => {});
    }

    expect(resolved).toBe(true);
  });
});
