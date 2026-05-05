import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type * as d from '@stencil/core';

import { DIST_LAZY, ASSETS } from '../../../../utils';
import {
  STENCIL_APP_GLOBALS_ID,
  STENCIL_CORE_ID,
  LAZY_BROWSER_ENTRY_ID,
  LAZY_EXTERNAL_ENTRY_ID,
} from '../../../bundle/entry-alias-ids';
import { stubComponentCompilerMeta } from '../../../types/_tests_/ComponentCompilerMeta.stub';
import { outputLazy } from '../lazy-output';

vi.mock('../../../bundle/bundle-output', () => ({
  bundleOutput: vi.fn().mockResolvedValue(null),
}));

import { bundleOutput } from '../../../bundle/bundle-output';

const setup = (outputTargets: d.OutputTarget[] = []) => {
  const config = mockValidatedConfig({ outputTargets });
  const compilerCtx = mockCompilerCtx(config);
  const buildCtx = mockBuildCtx(config, compilerCtx);
  return { config, compilerCtx, buildCtx };
};

const getLoaderEntry = (callArgs: any[], entryId: string): string => callArgs[3].loader[entryId];

describe('outputLazy', () => {
  beforeEach(() => {
    vi.mocked(bundleOutput).mockClear();
  });

  describe('external entry', () => {
    it('exports setNonce and defineCustomElements', async () => {
      const { config, compilerCtx, buildCtx } = setup([{ type: DIST_LAZY, esmDir: '/dist/esm' }]);
      await outputLazy(config, compilerCtx, buildCtx);

      const entry = getLoaderEntry(vi.mocked(bundleOutput).mock.calls[0], LAZY_EXTERNAL_ENTRY_ID);
      expect(entry).toContain(`export { setNonce } from '${STENCIL_CORE_ID}';`);
      expect(entry).toContain('export const defineCustomElements');
    });

    it('guards against non-browser environments', async () => {
      const { config, compilerCtx, buildCtx } = setup([{ type: DIST_LAZY, esmDir: '/dist/esm' }]);
      await outputLazy(config, compilerCtx, buildCtx);

      const entry = getLoaderEntry(vi.mocked(bundleOutput).mock.calls[0], LAZY_EXTERNAL_ENTRY_ID);
      expect(entry).toContain(`if (typeof window === 'undefined') return undefined;`);
    });

    it('does not produce an IIFE', async () => {
      const { config, compilerCtx, buildCtx } = setup([{ type: DIST_LAZY, esmDir: '/dist/esm' }]);
      await outputLazy(config, compilerCtx, buildCtx);

      const entry = getLoaderEntry(vi.mocked(bundleOutput).mock.calls[0], LAZY_EXTERNAL_ENTRY_ID);
      expect(entry).not.toContain('(async () =>');
    });
  });

  describe('browser entry', () => {
    it('produces an IIFE without setAssetPath when no components have assets', async () => {
      const { config, compilerCtx, buildCtx } = setup([
        { type: DIST_LAZY, esmDir: '/dist/browser', isBrowserBuild: true },
        { type: ASSETS, dir: '/dist/assets' },
      ]);
      buildCtx.components = [stubComponentCompilerMeta({ assetsDirs: [] })];
      await outputLazy(config, compilerCtx, buildCtx);

      const entry = getLoaderEntry(vi.mocked(bundleOutput).mock.calls[0], LAZY_BROWSER_ENTRY_ID);
      expect(entry).toContain('(async () =>');
      expect(entry).not.toContain('setAssetPath');
    });

    it('does not export defineCustomElements', async () => {
      const { config, compilerCtx, buildCtx } = setup([
        { type: DIST_LAZY, esmDir: '/dist/browser', isBrowserBuild: true },
      ]);
      await outputLazy(config, compilerCtx, buildCtx);

      const entry = getLoaderEntry(vi.mocked(bundleOutput).mock.calls[0], LAZY_BROWSER_ENTRY_ID);
      expect(entry).not.toContain('defineCustomElements');
    });

    it('imports globalScripts', async () => {
      const { config, compilerCtx, buildCtx } = setup([
        { type: DIST_LAZY, esmDir: '/dist/browser', isBrowserBuild: true },
      ]);
      await outputLazy(config, compilerCtx, buildCtx);

      const entry = getLoaderEntry(vi.mocked(bundleOutput).mock.calls[0], LAZY_BROWSER_ENTRY_ID);
      expect(entry).toContain(`import { globalScripts } from '${STENCIL_APP_GLOBALS_ID}';`);
    });

    describe('with asset path', () => {
      it('imports and calls setAssetPath when components have assetsDirs', async () => {
        const { config, compilerCtx, buildCtx } = setup([
          { type: DIST_LAZY, esmDir: '/dist/browser', isBrowserBuild: true },
          { type: ASSETS, dir: '/dist/assets' },
        ]);
        buildCtx.components = [
          stubComponentCompilerMeta({
            assetsDirs: [
              {
                absolutePath: '/src/assets',
                cmpRelativePath: 'assets',
                originalComponentPath: 'assets',
              },
            ],
          }),
        ];
        await outputLazy(config, compilerCtx, buildCtx);

        const entry = getLoaderEntry(vi.mocked(bundleOutput).mock.calls[0], LAZY_BROWSER_ENTRY_ID);
        expect(entry).toContain(`import { setAssetPath } from '${STENCIL_CORE_ID}';`);
        expect(entry).toContain(`setAssetPath(new URL(`);
        expect(entry).toContain(`import.meta.url)).href);`);
      });

      it('calls setAssetPath before globalScripts and bootstrapLazy', async () => {
        const { config, compilerCtx, buildCtx } = setup([
          { type: DIST_LAZY, esmDir: '/dist/browser', isBrowserBuild: true },
          { type: ASSETS, dir: '/dist/assets' },
        ]);
        buildCtx.components = [
          stubComponentCompilerMeta({
            assetsDirs: [
              {
                absolutePath: '/src/assets',
                cmpRelativePath: 'assets',
                originalComponentPath: 'assets',
              },
            ],
          }),
        ];
        await outputLazy(config, compilerCtx, buildCtx);

        const entry = getLoaderEntry(vi.mocked(bundleOutput).mock.calls[0], LAZY_BROWSER_ENTRY_ID);
        const assetPos = entry.indexOf('setAssetPath(');
        const globalsPos = entry.indexOf('globalScripts()');
        const bootstrapPos = entry.indexOf('bootstrapLazy(');
        expect(assetPos).toBeLessThan(globalsPos);
        expect(globalsPos).toBeLessThan(bootstrapPos);
      });

      it('does not set asset path when assets output target is absent', async () => {
        const { config, compilerCtx, buildCtx } = setup([
          { type: DIST_LAZY, esmDir: '/dist/browser', isBrowserBuild: true },
        ]);
        buildCtx.components = [
          stubComponentCompilerMeta({
            assetsDirs: [
              {
                absolutePath: '/src/assets',
                cmpRelativePath: 'assets',
                originalComponentPath: 'assets',
              },
            ],
          }),
        ];
        await outputLazy(config, compilerCtx, buildCtx);

        const entry = getLoaderEntry(vi.mocked(bundleOutput).mock.calls[0], LAZY_BROWSER_ENTRY_ID);
        expect(entry).not.toContain('setAssetPath');
      });
    });
  });
});
