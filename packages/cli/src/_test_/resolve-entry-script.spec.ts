import { mockValidatedConfig } from '@stencil/core/testing';
import { describe, it, expect } from 'vitest';
import type * as d from '@stencil/core/compiler';

import { resolveEntryScriptSrc } from '../resolve-entry-script';

const ROOT = '/project';

function setup(outputTargets: d.OutputTarget[], overrides: Partial<d.ValidatedConfig> = {}) {
  return mockValidatedConfig({
    rootDir: ROOT,
    fsNamespace: 'testing',
    outputTargets,
    ...overrides,
  });
}

describe('resolveEntryScriptSrc', () => {
  it('returns null when no output target produces a browser build (e.g. ssr-only)', () => {
    const config = setup([{ type: 'ssr' } as d.OutputTarget]);
    expect(resolveEntryScriptSrc(config)).toBeNull();
  });

  it('returns null with no output targets at all', () => {
    const config = setup([]);
    expect(resolveEntryScriptSrc(config)).toBeNull();
  });

  it('resolves a www target with default buildDir/baseUrl', () => {
    const config = setup([
      {
        type: 'www',
        dir: `${ROOT}/www`,
        buildDir: `${ROOT}/www/build`,
      } as d.OutputTargetWww,
    ]);
    expect(resolveEntryScriptSrc(config)).toBe('/build/testing.js');
  });

  it('respects a custom www buildDir', () => {
    const config = setup([
      {
        type: 'www',
        dir: `${ROOT}/www`,
        buildDir: `${ROOT}/www/assets/js`,
      } as d.OutputTargetWww,
    ]);
    expect(resolveEntryScriptSrc(config)).toBe('/assets/js/testing.js');
  });

  it('prefers the www target directly over the dist-lazy output it synthesizes internally', () => {
    const config = setup([
      { type: 'www', dir: `${ROOT}/www`, buildDir: `${ROOT}/www/build` } as d.OutputTargetWww,
      {
        type: 'dist-lazy',
        dir: `${ROOT}/www/build`,
        esmDir: `${ROOT}/www/build`,
        isBrowserBuild: true,
      } as d.OutputTargetDistLazy,
    ]);
    expect(resolveEntryScriptSrc(config)).toBe('/build/testing.js');
  });

  it('resolves a loader-bundle target (no www) via its synthesized dist-lazy output, relative to rootDir', () => {
    const config = setup([
      {
        type: 'dist-lazy',
        esmDir: `${ROOT}/dist/loader-bundle/testing`,
        isBrowserBuild: true,
      } as d.OutputTargetDistLazy,
    ]);
    expect(resolveEntryScriptSrc(config)).toBe('/dist/loader-bundle/testing/testing.js');
  });

  it('falls back to a standalone target with default autoLoader', () => {
    const config = setup([
      {
        type: 'standalone',
        dir: `${ROOT}/dist/standalone`,
        autoLoader: true,
      } as d.OutputTargetStandalone,
    ]);
    expect(resolveEntryScriptSrc(config)).toBe('/dist/standalone/loader.js');
  });

  it('uses a custom autoLoader fileName', () => {
    const config = setup([
      {
        type: 'standalone',
        dir: `${ROOT}/dist/standalone`,
        autoLoader: { fileName: 'my-loader' },
      } as d.OutputTargetStandalone,
    ]);
    expect(resolveEntryScriptSrc(config)).toBe('/dist/standalone/my-loader.js');
  });

  it('returns null when standalone has autoLoader explicitly disabled', () => {
    const config = setup([
      {
        type: 'standalone',
        dir: `${ROOT}/dist/standalone`,
        autoLoader: false,
      } as d.OutputTargetStandalone,
    ]);
    expect(resolveEntryScriptSrc(config)).toBeNull();
  });

  it('prefers dist-lazy over standalone when both are present', () => {
    const config = setup([
      {
        type: 'standalone',
        dir: `${ROOT}/dist/standalone`,
        autoLoader: true,
      } as d.OutputTargetStandalone,
      {
        type: 'dist-lazy',
        esmDir: `${ROOT}/dist/loader-bundle/testing`,
        isBrowserBuild: true,
      } as d.OutputTargetDistLazy,
    ]);
    expect(resolveEntryScriptSrc(config)).toBe('/dist/loader-bundle/testing/testing.js');
  });
});
