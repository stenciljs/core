import { describe, expect, it, beforeEach, MockInstance, vi, afterEach } from 'vitest';
import type * as d from '@stencil/core';

import { mockComponentMeta, mockModule, mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import * as test from '../../transformers/map-imports-to-path-aliases';
import { outputCollection } from '../collection';

describe('Stencil Collection output target', () => {
  let mockConfig: d.ValidatedConfig;
  let mockedBuildCtx: d.BuildCtx;
  let mockedCompilerCtx: d.CompilerCtx;
  let changedModules: d.Module[];

  let mapImportPathSpy: MockInstance;

  const mockTraverse = vi.fn().mockImplementation((source: any) => source);
  const mockMap = vi.fn().mockImplementation(() => mockTraverse);
  const target: d.OutputTargetCollection = {
    type: 'collection',
    dir: '/dist/collection',
  };

  beforeEach(() => {
    mockConfig = mockValidatedConfig({
      srcDir: '/src',
      bundles: [],
    });
    mockedBuildCtx = mockBuildCtx();
    mockedCompilerCtx = mockCompilerCtx();
    changedModules = [
      mockModule({
        staticSourceFileText: '',
        jsFilePath: '/src/main.js',
        sourceFilePath: '/src/main.ts',
      }),
    ];

    vi.spyOn(mockedCompilerCtx.fs, 'writeFile');

    mapImportPathSpy = vi.spyOn(test, 'mapImportsToPathAliases');
    mapImportPathSpy.mockReturnValue(mockMap);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    { devMode: false, excludeComponents: ['my-playground'], excluded: true },
    { devMode: false, excludeComponents: ['*-playground'], excluded: true },
    { devMode: false, excludeComponents: ['other-component'], excluded: false },
    { devMode: false, excludeComponents: [], excluded: false },
    { devMode: false, excludeComponents: undefined, excluded: false },
    { devMode: true, excludeComponents: ['my-playground'], excluded: false },
    { devMode: true, excludeComponents: ['*-playground'], excluded: false },
  ])(
    'writes collection with devMode=$devMode and excludeComponents=$excludeComponents (excluded=$excluded)',
    async ({ devMode, excludeComponents, excluded }) => {
      mockConfig.outputTargets = [target];
      mockConfig.devMode = devMode;
      mockConfig.excludeComponents = excludeComponents;
      const includedModule = mockModule({
        staticSourceFileText: 'export class Button {}',
        jsFilePath: '/src/button.js',
        sourceFilePath: '/src/button.tsx',
        cmps: [mockComponentMeta({ tagName: 'my-button' })],
      });
      const excludedModule = mockModule({
        staticSourceFileText: 'export class Playground {}',
        jsFilePath: '/src/playground.js',
        sourceFilePath: '/src/playground.tsx',
        sourceMapPath: '/src/playground.js.map',
        sourceMapFileText: '{}',
        cmps: [mockComponentMeta({ tagName: 'my-playground' })],
      });
      const mixinModule = mockModule({
        staticSourceFileText: 'export class Base {}',
        jsFilePath: '/src/base.js',
        sourceFilePath: '/src/base.ts',
        hasExportableMixins: true,
        cmps: [],
      });
      changedModules.push(includedModule, excludedModule, mixinModule);
      mockedBuildCtx.moduleFiles = changedModules;

      await outputCollection(mockConfig, mockedCompilerCtx, mockedBuildCtx, changedModules);

      expect(mockedBuildCtx.diagnostics).toEqual([]);
      const writtenPaths = vi
        .mocked(mockedCompilerCtx.fs.writeFile)
        .mock.calls.map(([filePath]) => filePath);
      expect(writtenPaths).toEqual(
        expect.arrayContaining([
          '/dist/collection/main.js',
          '/dist/collection/button.js',
          '/dist/collection/base.js',
          '/dist/collection/collection-manifest.json',
        ]),
      );
      expect(writtenPaths.includes('/dist/collection/playground.js')).toBe(!excluded);
      expect(writtenPaths.includes('/dist/collection/playground.js.map')).toBe(!excluded);
      const manifest = JSON.parse(
        await mockedCompilerCtx.fs.readFile('/dist/collection/collection-manifest.json'),
      );
      expect(manifest.entries).toEqual(excluded ? ['button.js'] : ['button.js', 'playground.js']);
      expect(manifest.mixins).toEqual(['base.js']);
    },
  );

  it('excludes unchanged components from the collection manifest', async () => {
    mockConfig.outputTargets = [target];
    mockConfig.devMode = false;
    mockConfig.excludeComponents = ['my-playground'];
    mockedBuildCtx.moduleFiles = [
      mockModule({
        jsFilePath: '/src/button.js',
        cmps: [mockComponentMeta({ tagName: 'my-button' })],
      }),
      mockModule({
        jsFilePath: '/src/playground.js',
        cmps: [mockComponentMeta({ tagName: 'my-playground' })],
      }),
    ];

    await outputCollection(mockConfig, mockedCompilerCtx, mockedBuildCtx, []);

    expect(mockedBuildCtx.diagnostics).toEqual([]);
    const manifest = JSON.parse(
      await mockedCompilerCtx.fs.readFile('/dist/collection/collection-manifest.json'),
    );
    expect(manifest.entries).toEqual(['button.js']);
  });

  describe('app-data.js hydrateClientSide flag', () => {
    const collectionTarget: d.OutputTargetCollection = {
      type: 'collection',
      dir: '/dist/collection',
    };
    const appDataPath = '/dist/collection/app-data.js';

    it('sets hydrateClientSide: true when an SSR output target is present', async () => {
      const config = mockValidatedConfig({
        srcDir: '/src',
        bundles: [],
        outputTargets: [collectionTarget, { type: 'ssr', dir: '/dist/ssr' } as d.OutputTargetSsr],
      });
      const compilerCtx = mockCompilerCtx(config);
      const buildCtx = mockBuildCtx(config, compilerCtx);

      await outputCollection(config, compilerCtx, buildCtx, changedModules);

      const content = await compilerCtx.fs.readFile(appDataPath);
      expect(content).toContain('"hydrateClientSide": true');
    });

    it('sets hydrateClientSide: false when no SSR output target is present', async () => {
      const config = mockValidatedConfig({
        srcDir: '/src',
        bundles: [],
        outputTargets: [collectionTarget],
      });
      const compilerCtx = mockCompilerCtx(config);
      const buildCtx = mockBuildCtx(config, compilerCtx);

      await outputCollection(config, compilerCtx, buildCtx, changedModules);

      const content = await compilerCtx.fs.readFile(appDataPath);
      expect(content).toContain('"hydrateClientSide": false');
    });
  });

  describe('transform aliased import paths', () => {
    // These tests ensure that the transformer for import paths is called regardless
    // of the config value (the function will decide whether or not to actually do anything) to avoid
    // a race condition with duplicate file writes
    it.each([true, false])(
      'calls function to transform aliased import paths when the output target config flag is `%s`',
      async (transformAliasedImportPaths: boolean) => {
        mockConfig.outputTargets = [
          {
            ...target,
            transformAliasedImportPaths,
          },
        ];

        await outputCollection(mockConfig, mockedCompilerCtx, mockedBuildCtx, changedModules);

        expect(mapImportPathSpy).toHaveBeenCalledWith(mockConfig, '/dist/collection/main.js', {
          dir: '/dist/collection',
          transformAliasedImportPaths,
          type: 'collection',
        });
        expect(mapImportPathSpy).toHaveBeenCalledTimes(1);
      },
    );
  });
});
