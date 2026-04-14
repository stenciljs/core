import {
  mockBuildCtx,
  mockCompilerCtx,
  mockModule,
  mockValidatedConfig,
} from '@stencil/core/testing';
import { describe, expect, it, beforeEach, MockInstance, vi, afterEach } from 'vitest';
import type * as d from '@stencil/core';

import * as test from '../../transformers/map-imports-to-path-aliases';
import { outputStencilMeta } from '../stencil-meta';

describe('Dist Collection output target', () => {
  let mockConfig: d.ValidatedConfig;
  let mockedBuildCtx: d.BuildCtx;
  let mockedCompilerCtx: d.CompilerCtx;
  let changedModules: d.Module[];

  let mapImportPathSpy: MockInstance;

  const mockTraverse = vi.fn().mockImplementation((source: any) => source);
  const mockMap = vi.fn().mockImplementation(() => mockTraverse);
  const target: d.OutputTargetStencilMeta = {
    type: 'stencil-meta',
    dir: '/dist/collection',
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

    vi.spyOn(mockedCompilerCtx.fs, 'writeFile');

    mapImportPathSpy = vi.spyOn(test, 'mapImportsToPathAliases');
    mapImportPathSpy.mockReturnValue(mockMap);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

        await outputStencilMeta(mockConfig, mockedCompilerCtx, mockedBuildCtx, changedModules);

        expect(mapImportPathSpy).toHaveBeenCalledWith(mockConfig, '/dist/collection/main.js', {
          dir: '/dist/collection',
          transformAliasedImportPaths,
          type: 'stencil-meta',
        });
        expect(mapImportPathSpy).toHaveBeenCalledTimes(1);
      },
    );
  });
});
