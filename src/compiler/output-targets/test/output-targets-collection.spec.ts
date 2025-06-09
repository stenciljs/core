import { mockBuildCtx, mockCompilerCtx, mockModule, mockValidatedConfig } from '@stencil/core/testing';

import type * as d from '../../../declarations';
import * as test from '../../transformers/map-imports-to-path-aliases';
import { outputCollection } from '../dist-collection';

describe('Dist Collection output target', () => {
  let mockConfig: d.ValidatedConfig;
  let mockedBuildCtx: d.BuildCtx;
  let mockedCompilerCtx: d.CompilerCtx;
  let changedModules: d.Module[];

  let mapImportPathSpy: jest.SpyInstance;

  const mockTraverse = jest.fn().mockImplementation((source: any) => source);
  const mockMap = jest.fn().mockImplementation(() => mockTraverse);
  const target: d.OutputTargetDistCollection = {
    type: 'dist-collection',
    dir: '',
    collectionDir: '/dist/collection',
  };

  beforeEach(() => {
    mockConfig = mockValidatedConfig({
      srcDir: '/src',
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

    jest.spyOn(mockedCompilerCtx.fs, 'writeFile');

    mapImportPathSpy = jest.spyOn(test, 'mapImportsToPathAliases');
    mapImportPathSpy.mockReturnValue(mockMap);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
          collectionDir: '/dist/collection',
          dir: '',
          transformAliasedImportPaths,
          type: 'dist-collection',
        });
        expect(mapImportPathSpy).toHaveBeenCalledTimes(1);
      },
    );
  });
});
