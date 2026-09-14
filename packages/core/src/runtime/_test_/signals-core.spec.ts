import { describe, it, expect, beforeEach } from '@stencil/vitest';
import { vi } from 'vitest';

const DEDUPE_KEY = Symbol.for('stencil.preact-signals-core');

describe('signals-core dedup', () => {
  beforeEach(() => {
    delete (globalThis as any)[DEDUPE_KEY];
    vi.resetModules();
  });

  it('does not touch the global dedup slot on import alone (tree-shakable when unused)', async () => {
    await import('../signals-core');
    expect((globalThis as any)[DEDUPE_KEY]).toBeUndefined();
  });

  it('registers itself in the global dedup slot on first call when none exists yet', async () => {
    const mod = await import('../signals-core');
    mod.signal(1);
    expect((globalThis as any)[DEDUPE_KEY]).toBeDefined();
  });

  it('delegates every export to an already-registered instance', async () => {
    // simulate another copy of @stencil/core having already loaded and won the race
    const fakeSignal = { value: 1 };
    const fakeCore = {
      batch: vi.fn(),
      computed: vi.fn(),
      effect: vi.fn(),
      signal: vi.fn(() => fakeSignal),
      untracked: vi.fn(),
    };
    (globalThis as any)[DEDUPE_KEY] = fakeCore;

    const mod = await import('../signals-core');

    expect(mod.signal(1)).toBe(fakeSignal);
    expect(fakeCore.signal).toHaveBeenCalledWith(1, undefined);

    mod.batch(() => {});
    mod.computed(() => 1);
    mod.effect(() => {});
    mod.untracked(() => {});
    expect(fakeCore.batch).toHaveBeenCalledOnce();
    expect(fakeCore.computed).toHaveBeenCalledOnce();
    expect(fakeCore.effect).toHaveBeenCalledOnce();
    expect(fakeCore.untracked).toHaveBeenCalledOnce();
  });

  it('never re-registers once the slot is populated - every wrapper shares the same core', async () => {
    const mod = await import('../signals-core');
    mod.signal(1);
    const registered = (globalThis as any)[DEDUPE_KEY];

    mod.effect(() => {});
    expect((globalThis as any)[DEDUPE_KEY]).toBe(registered);
  });
});
