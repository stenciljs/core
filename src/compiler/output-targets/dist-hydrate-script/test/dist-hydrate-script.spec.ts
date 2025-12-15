import type * as d from '@stencil/core/declarations';
import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import path from 'path';

import * as optimizeModuleMod from '../../../optimize/optimize-module';
import { writeHydrateOutputs } from '../write-hydrate-outputs';

describe('dist-hydrate-script', () => {
  describe('minification', () => {
    let optimizeModuleSpy: jest.SpyInstance;
    let mockFs: any;

    beforeEach(() => {
      // Spy on optimizeModule to verify it's called with correct minify parameter
      optimizeModuleSpy = jest.spyOn(optimizeModuleMod, 'optimizeModule');
      optimizeModuleSpy.mockResolvedValue({
        output: 'const minified="code";',
        diagnostics: [],
        sourceMap: undefined,
      });
    });

    afterEach(() => {
      optimizeModuleSpy.mockRestore();
    });

    it('should call optimizeModule when outputTarget.minify is true', async () => {
      const config = mockValidatedConfig();
      const compilerCtx = mockCompilerCtx(config);
      const buildCtx = mockBuildCtx(config, compilerCtx);

      // Mock filesystem operations
      mockFs = compilerCtx.fs;
      mockFs.readFile = jest.fn().mockResolvedValue('{"name":"test"}');
      mockFs.writeFile = jest.fn().mockResolvedValue(undefined);
      mockFs.copyFile = jest.fn().mockResolvedValue(undefined);

      const outputTarget: d.OutputTargetHydrate = {
        type: 'dist-hydrate-script',
        dir: path.join(config.rootDir, 'dist', 'hydrate'),
        minify: true,
      };

      const rollupOutput = {
        output: [
          {
            type: 'chunk' as const,
            fileName: 'index.js',
            code: 'export const test = "unminified code";',
            isEntry: true,
          },
        ],
      };

      await writeHydrateOutputs(config, compilerCtx, buildCtx, [outputTarget], rollupOutput as any);

      expect(optimizeModuleSpy).toHaveBeenCalledWith(
        config,
        compilerCtx,
        expect.objectContaining({
          minify: true,
        }),
      );
    });

    it('should not call optimizeModule when outputTarget.minify is false', async () => {
      const config = mockValidatedConfig();
      const compilerCtx = mockCompilerCtx(config);
      const buildCtx = mockBuildCtx(config, compilerCtx);

      // Mock filesystem operations
      mockFs = compilerCtx.fs;
      mockFs.readFile = jest.fn().mockResolvedValue('{"name":"test"}');
      mockFs.writeFile = jest.fn().mockResolvedValue(undefined);
      mockFs.copyFile = jest.fn().mockResolvedValue(undefined);

      const outputTarget: d.OutputTargetHydrate = {
        type: 'dist-hydrate-script',
        dir: path.join(config.rootDir, 'dist', 'hydrate'),
        minify: false,
      };

      const rollupOutput = {
        output: [
          {
            type: 'chunk' as const,
            fileName: 'index.js',
            code: 'export const test = "unminified code";',
            isEntry: true,
          },
        ],
      };

      await writeHydrateOutputs(config, compilerCtx, buildCtx, [outputTarget], rollupOutput as any);

      expect(optimizeModuleSpy).not.toHaveBeenCalled();
    });

    it('should not call optimizeModule when outputTarget.minify is undefined', async () => {
      const config = mockValidatedConfig();
      const compilerCtx = mockCompilerCtx(config);
      const buildCtx = mockBuildCtx(config, compilerCtx);

      // Mock filesystem operations
      mockFs = compilerCtx.fs;
      mockFs.readFile = jest.fn().mockResolvedValue('{"name":"test"}');
      mockFs.writeFile = jest.fn().mockResolvedValue(undefined);
      mockFs.copyFile = jest.fn().mockResolvedValue(undefined);

      const outputTarget: d.OutputTargetHydrate = {
        type: 'dist-hydrate-script',
        dir: path.join(config.rootDir, 'dist', 'hydrate'),
        // minify is undefined
      };

      const rollupOutput = {
        output: [
          {
            type: 'chunk' as const,
            fileName: 'index.js',
            code: 'export const test = "unminified code";',
            isEntry: true,
          },
        ],
      };

      await writeHydrateOutputs(config, compilerCtx, buildCtx, [outputTarget], rollupOutput as any);

      expect(optimizeModuleSpy).not.toHaveBeenCalled();
    });
  });
});
