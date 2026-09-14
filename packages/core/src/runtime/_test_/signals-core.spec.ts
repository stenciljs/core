import { describe, it, expect, beforeEach } from '@stencil/vitest';
import { vi } from 'vitest';

const DEDUPE_KEY = Symbol.for('stencil.preact-signals-core');

describe('signals-core dedup', () => {
  beforeEach(() => {
    delete (globalThis as any)[DEDUPE_KEY];
    vi.resetModules();
  });

  it('registers itself in the global dedup slot when none exists yet', async () => {
    const mod = await import('../signals-core');
    expect((globalThis as any)[DEDUPE_KEY]).toBeDefined();
    expect(mod.signal).toBe((globalThis as any)[DEDUPE_KEY].signal);
  });

  it('reuses an already-registered instance instead of its own local import', async () => {
    // simulate another copy of @stencil/core having already loaded
    const fakeCore = {
      batch: () => {},
      computed: () => {},
      effect: () => {},
      signal: () => {},
      untracked: () => {},
    };
    (globalThis as any)[DEDUPE_KEY] = fakeCore;

    const mod = await import('../signals-core');

    expect(mod.signal).toBe(fakeCore.signal);
    expect(mod.computed).toBe(fakeCore.computed);
    expect(mod.effect).toBe(fakeCore.effect);
    expect(mod.batch).toBe(fakeCore.batch);
    expect(mod.untracked).toBe(fakeCore.untracked);
  });
});
