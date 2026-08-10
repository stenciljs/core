import * as path from 'path';

/**
 * These tests exercise the *real* `loadModule()` (not the testing platform's
 * mocked version used elsewhere) so the `?s-retry=N` cache-busting query
 * param it appends on a retried `import()` is verified end-to-end, rather
 * than via a helper exported solely for testing. A failed dynamic `import()`
 * only "succeeds" here if a virtual module was registered at the *exact*
 * specifier `loadModule()` requested, so a broken query-param join would
 * cause the request to genuinely fail to resolve, just like a real 404 would.
 */
describe('loadModule cache-busting on retry', () => {
  const bundleId = 'cmp-retry-cache-bust';
  const cmpMeta: any = { $tagName$: 'cmp-retry-cache-bust', $lazyBundleId$: bundleId };
  const hostRef: any = { $hostElement$: {} };
  let bundleDir: string;

  beforeEach(() => {
    jest.resetModules();
    bundleDir = path.dirname(require.resolve('../client-load-module'));
  });

  it('retries a failed import with an incrementing ?s-retry=N param', async () => {
    const { loadModule } = require('../client-load-module');

    // No virtual module registered for the bare bundle path, so this first
    // attempt fails to resolve -- simulating a dropped network request.
    expect(await loadModule(cmpMeta, hostRef)).toBeUndefined();

    // A second attempt should request `?s-retry=1`. Registering a virtual
    // module at that exact path (and no other) proves the real join logic
    // produced it.
    jest.mock(path.join(bundleDir, `${bundleId}.entry.js?s-retry=1`), () => ({ cmp_retry_cache_bust: class {} }), {
      virtual: true,
    });
    expect(await loadModule(cmpMeta, hostRef)).toBeDefined();
  });

  it('joins the retry and HMR params with "&", retry first', async () => {
    const { loadModule } = require('../client-load-module');
    const { BUILD } = require('@app-data');
    BUILD.hotModuleReplacement = true;

    expect(await loadModule(cmpMeta, hostRef, 'abc123')).toBeUndefined();

    jest.mock(
      path.join(bundleDir, `${bundleId}.entry.js?s-retry=1&s-hmr=abc123`),
      () => ({ cmp_retry_cache_bust: class {} }),
      { virtual: true },
    );
    expect(await loadModule(cmpMeta, hostRef, 'abc123')).toBeDefined();

    BUILD.hotModuleReplacement = false;
  });
});
