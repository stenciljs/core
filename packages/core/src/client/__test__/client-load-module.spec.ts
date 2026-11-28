import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as d from '@stencil/core';

/**
 * Test loadModule()'s cache-busting behavior when a module fails to load and is retried.
 */
describe('loadModule cache-busting on retry', () => {
  const bundleId = 'cmp-retry-cache-bust';
  const cmpMeta = {
    $tagName$: 'cmp-retry-cache-bust',
    $lazyBundleId$: bundleId,
  } as d.ComponentRuntimeMeta;
  const hostRef = { $hostElement$: {} } as d.HostRef;

  // client-load-module.ts caches failed-attempt counts at module scope, so each test needs
  // a fresh module instance to start from a clean retry count.
  beforeEach(() => {
    vi.resetModules();
  });

  const attemptedSpecifier = async (
    loadModule: typeof import('../client-load-module').loadModule,
    hmrVersionId?: string,
  ) => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await loadModule(cmpMeta, hostRef, hmrVersionId);
    const [error] = errorSpy.mock.calls.at(-1)!;
    errorSpy.mockRestore();
    return (error as Error).message;
  };

  it('retries a failed import with an incrementing ?s-retry=N param', async () => {
    const { loadModule } = await import('../client-load-module');

    expect(await attemptedSpecifier(loadModule)).toContain(`${bundleId}.entry.js'`);
    expect(await attemptedSpecifier(loadModule)).toContain(`${bundleId}.entry.js?s-retry=1`);
    expect(await attemptedSpecifier(loadModule)).toContain(`${bundleId}.entry.js?s-retry=2`);
  });

  it('joins the retry and HMR params with "&", retry first', async () => {
    const { loadModule } = await import('../client-load-module');
    const { BUILD } = await import('virtual:app-data');
    BUILD.hotModuleReplacement = true;

    expect(await attemptedSpecifier(loadModule, 'abc123')).toContain(
      `${bundleId}.entry.js?s-hmr=abc123`,
    );
    expect(await attemptedSpecifier(loadModule, 'abc123')).toContain(
      `${bundleId}.entry.js?s-retry=1&s-hmr=abc123`,
    );

    BUILD.hotModuleReplacement = false;
  });
});
