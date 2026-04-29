import {
  mockBuildCtx,
  mockCompilerCtx,
  mockModule,
  mockValidatedConfig,
} from '@stencil/core/testing';
import { describe, expect, it, beforeEach, MockInstance, vi, afterEach } from 'vitest';
import type * as d from '@stencil/core';

import * as test from '../../transformers/map-imports-to-path-aliases';
import { outputStencilRebundle } from '../stencil-rebundle';

describe('Stencil Rebundle output target', () => {
  let mockConfig: d.ValidatedConfig;
  let mockedBuildCtx: d.BuildCtx;
  let mockedCompilerCtx: d.CompilerCtx;
  let changedModules: d.Module[];

  let mapImportPathSpy: MockInstance;

  const mockTraverse = vi.fn().mockImplementation((source: any) => source);
  const mockMap = vi.fn().mockImplementation(() => mockTraverse);
  const target: d.OutputTargetStencilRebundle = {
    type: 'stencil-rebundle',
    dir: '/dist/stencil-rebundle',
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

        await outputStencilRebundle(mockConfig, mockedCompilerCtx, mockedBuildCtx, changedModules);

        expect(mapImportPathSpy).toHaveBeenCalledWith(
          mockConfig,
          '/dist/stencil-rebundle/main.js',
          {
            dir: '/dist/stencil-rebundle',
            transformAliasedImportPaths,
            type: 'stencil-rebundle',
          },
        );
        expect(mapImportPathSpy).toHaveBeenCalledTimes(1);
      },
    );
  });
});
