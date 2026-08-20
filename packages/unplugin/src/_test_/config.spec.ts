import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadStencilConfig, stencilConfigToOverrides } from '../config.js';

// ---------------------------------------------------------------------------
// stencilConfigToOverrides — pure function, no I/O
// ---------------------------------------------------------------------------

describe('stencilConfigToOverrides', () => {
  it('returns empty overrides for an empty config', () => {
    expect(stencilConfigToOverrides({})).toEqual({});
  });

  it('signalBacking: true sets both signalBacking and vdomSignals overrides', () => {
    expect(stencilConfigToOverrides({ signalBacking: true })).toEqual({
      signalBacking: true,
      vdomSignals: true,
    });
  });

  it('compat.lightDomPatches: false disables all slot patch flags', () => {
    expect(stencilConfigToOverrides({ compat: { lightDomPatches: false } })).toEqual({
      lightDomPatches: false,
      slotChildNodes: false,
      slotCloneNode: false,
      slotDomMutations: false,
      slotTextContent: false,
    });
  });

  it('compat.lightDomPatches: true produces no overrides (already the default)', () => {
    expect(stencilConfigToOverrides({ compat: { lightDomPatches: true } })).toEqual({});
  });

  it('compat.lightDomPatches: undefined produces no overrides', () => {
    expect(stencilConfigToOverrides({ compat: {} })).toEqual({});
  });

  it('compat.lightDomPatches: object enables only specified patches, disables the rest', () => {
    expect(
      stencilConfigToOverrides({
        compat: { lightDomPatches: { childNodes: true, cloneNode: true } },
      }),
    ).toEqual({
      lightDomPatches: true,
      slotChildNodes: true,
      slotCloneNode: true,
      slotDomMutations: false,
      slotTextContent: false,
    });
  });

  it('compat.lifecycleDOMEvents: true adds the override', () => {
    expect(stencilConfigToOverrides({ compat: { lifecycleDOMEvents: true } })).toEqual({
      lifecycleDOMEvents: true,
    });
  });

  it('compat.initializeNextTick: true adds the override', () => {
    expect(stencilConfigToOverrides({ compat: { initializeNextTick: true } })).toEqual({
      initializeNextTick: true,
    });
  });

  it('combines signalBacking and compat overrides', () => {
    const result = stencilConfigToOverrides({
      signalBacking: true,
      compat: { lightDomPatches: false, lifecycleDOMEvents: true },
    });
    expect(result).toEqual({
      signalBacking: true,
      vdomSignals: true,
      lightDomPatches: false,
      slotChildNodes: false,
      slotCloneNode: false,
      slotDomMutations: false,
      slotTextContent: false,
      lifecycleDOMEvents: true,
    });
  });
});

// ---------------------------------------------------------------------------
// loadStencilConfig — reads real files via jiti
// ---------------------------------------------------------------------------

describe('loadStencilConfig', () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = join(tmpdir(), `stencil-unplugin-test-${process.pid}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns null when no config file exists', async () => {
    const emptyDir = join(tmpDir, 'empty');
    mkdirSync(emptyDir, { recursive: true });
    expect(await loadStencilConfig(emptyDir)).toBeNull();
  });

  it('loads signalBacking from stencil.config.js', async () => {
    const dir = join(tmpDir, 'signal');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'stencil.config.js'), `export const config = { signalBacking: true };`);
    const result = await loadStencilConfig(dir);
    expect(result).toEqual({ signalBacking: true });
  });

  it('handles a default export', async () => {
    const dir = join(tmpDir, 'default-export');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'stencil.config.js'), `export default { signalBacking: true };`);
    const result = await loadStencilConfig(dir);
    expect(result).toEqual({ signalBacking: true });
  });

  it('extracts compat flags', async () => {
    const dir = join(tmpDir, 'compat');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'stencil.config.js'),
      `export const config = { compat: { lightDomPatches: false, lifecycleDOMEvents: true } };`,
    );
    const result = await loadStencilConfig(dir);
    expect(result).toEqual({
      compat: { lightDomPatches: false, lifecycleDOMEvents: true },
    });
  });

  it('ignores config fields that are not transpile-relevant', async () => {
    const dir = join(tmpDir, 'irrelevant');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'stencil.config.js'),
      `export const config = { namespace: 'my-app', srcDir: './src', signalBacking: true };`,
    );
    const result = await loadStencilConfig(dir);
    expect(result).toEqual({ signalBacking: true });
  });

  it('returns null for a malformed config (no valid export)', async () => {
    const dir = join(tmpDir, 'malformed');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'stencil.config.js'), `export const notConfig = {};`);
    expect(await loadStencilConfig(dir)).toBeNull();
  });

  it('returns null when the config file throws on load', async () => {
    const dir = join(tmpDir, 'throws');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'stencil.config.js'), `throw new Error('bad config');`);
    expect(await loadStencilConfig(dir)).toBeNull();
  });

  it('prefers stencil.config.ts over stencil.config.js when both exist', async () => {
    const dir = join(tmpDir, 'priority');
    mkdirSync(dir, { recursive: true });
    // .ts is listed first in CONFIG_CANDIDATES so it wins
    writeFileSync(join(dir, 'stencil.config.ts'), `export const config = { signalBacking: true };`);
    writeFileSync(
      join(dir, 'stencil.config.js'),
      `export const config = { signalBacking: false };`,
    );
    const result = await loadStencilConfig(dir);
    expect(result).toEqual({ signalBacking: true });
  });
});
