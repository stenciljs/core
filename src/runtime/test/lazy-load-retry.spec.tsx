import { flushAll, flushLoadModule, getHostRef, registerInstance, registerModule, win } from '@platform';

import { LazyBundlesRuntimeData } from '../../internal';
import { HOST_FLAGS } from '../../utils';
import { bootstrapLazy } from '../bootstrap-lazy';

describe('lazy-load failure recovery', () => {
  const bundleId = 'cmp-retry-bundle';
  let lazyBundles: LazyBundlesRuntimeData;

  beforeEach(() => {
    lazyBundles = [[bundleId, [[0, 'cmp-retry', {}]]]];
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
  });

  it('retries initialization when the host element is reconnected after a failed load', async () => {
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

    await flushLoadModule(bundleId);
    await flushAll().catch(() => {});

    const hostRef = getHostRef(elm);
    expect(hostRef?.$lazyInstance$).toBeInstanceOf(CmpRetry);
    expect((hostRef?.$flags$ ?? 0) & HOST_FLAGS.hasInitializedComponent).toBe(HOST_FLAGS.hasInitializedComponent);
  });
});
