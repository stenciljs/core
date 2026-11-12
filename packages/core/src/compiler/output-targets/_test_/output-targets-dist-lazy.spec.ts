import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as d from '@stencil/core';

import { mockCompilerSystem, mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import { DIST_LAZY, GLOBAL_STYLE } from '../../../utils';
import * as bundleOutputModule from '../../bundle/bundle-output';
import { stubComponentCompilerMeta } from '../../types/_tests_/ComponentCompilerMeta.stub';
import { outputLazy } from '../dist-lazy/lazy-output';
import type { BundleOptions } from '../../bundle/bundle-interface';

describe('outputLazy', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;

  beforeEach(() => {
    config = mockValidatedConfig({ sys: mockCompilerSystem() });
    config.outputTargets = [
      { type: DIST_LAZY, esmDir: '/dist/esm', isBrowserBuild: true } as d.OutputTargetDistLazy,
    ];
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Run the lazy output up to bundling and report the `staticHydrationStyles` build flag it
   * bundles with - `true` turns off bootstrap-loader's runtime FOUC `<style>` injection.
   * @param globalStyle the global-style input's content, if there is one
   * @param files any other files the input references
   * @returns the flag
   */
  const staticHydrationStyles = async (
    globalStyle?: string,
    files: Record<string, string> = {},
  ) => {
    if (globalStyle !== undefined) {
      await compilerCtx.fs.writeFile('/src/global.css', globalStyle);
      config.outputTargets.push({
        type: GLOBAL_STYLE,
        input: '/src/global.css',
        dir: '/dist/assets',
        fileName: 'global.css',
      } as d.OutputTargetGlobalStyle);
    }
    for (const [path, content] of Object.entries(files)) {
      await compilerCtx.fs.writeFile(path, content);
    }
    const bundle = vi.spyOn(bundleOutputModule, 'bundleOutput').mockResolvedValue(undefined);

    await outputLazy(config, compilerCtx, buildCtx);

    expect(bundle).toHaveBeenCalled();
    return (bundle.mock.calls[0][3] as BundleOptions).conditionals!.staticHydrationStyles;
  };

  describe('staticHydrationStyles', () => {
    it('is off without a global-style output, so the loader injects FOUC styles', async () => {
      expect(await staticHydrationStyles()).toBe(false);
    });

    it('is off when no global-style input imports stencil-hydrate', async () => {
      expect(await staticHydrationStyles('@import "stencil-component-globals";\n:root{}')).toBe(
        false,
      );
    });

    it('is on when a global-style input imports stencil-hydrate', async () => {
      expect(await staticHydrationStyles('@import "stencil-hydrate" layer(init);')).toBe(true);
    });

    it('is on when the import lives in a partial', async () => {
      expect(
        await staticHydrationStyles("@import './partials/hydrate.css';", {
          '/src/partials/hydrate.css': '@import url(stencil-hydrate);',
        }),
      ).toBe(true);
    });
  });

  describe('staticHydrationStyles alongside an anchor', () => {
    beforeEach(() => {
      config.hydratedFlag = {
        name: 'hydrated',
        selector: 'class',
        property: 'visibility',
        initialValue: 'hidden',
        hydratedValue: 'inherit',
      };
      buildCtx.components = [stubComponentCompilerMeta({ tagName: 'cmp-a' })];
    });

    it('is on when a component declares a global style, without any import', async () => {
      buildCtx.components[0].globalStyles = [{ styleStr: 'cmp-a{}', absolutePath: null }];

      expect(await staticHydrationStyles()).toBe(true);
    });

    it('is on when there are CSS-only components, without any import', async () => {
      buildCtx.cssOnlyComponents = [stubComponentCompilerMeta({ tagName: 'css-badge' })];

      expect(await staticHydrationStyles()).toBe(true);
    });

    it('is off with no anchor, so the loader keeps injecting', async () => {
      expect(await staticHydrationStyles()).toBe(false);
    });

    it('is off when prehydration hiding is disabled', async () => {
      buildCtx.cssOnlyComponents = [stubComponentCompilerMeta({ tagName: 'css-badge' })];
      config.invisiblePrehydration = false;

      expect(await staticHydrationStyles()).toBe(false);
    });
  });
});
