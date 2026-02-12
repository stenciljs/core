import type * as d from '@stencil/core';
import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import path from 'path';
import { describe, expect, it, beforeEach, vi, MockInstance, afterEach } from 'vitest';
import { validateHydrateScript } from '../../../config/outputs/validate-hydrate-script';
import * as optimizeModuleMod from '../../../optimize/optimize-module';
import { writeHydrateOutputs } from '../write-hydrate-outputs';

describe('dist-hydrate-script', () => {
  describe('minification', () => {
    let optimizeModuleSpy: MockInstance;
    let mockFs: any;

    beforeEach(() => {
      // Spy on optimizeModule to verify it's called with correct minify parameter
      optimizeModuleSpy = vi.spyOn(optimizeModuleMod, 'optimizeModule');
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
      mockFs.readFile = vi.fn().mockResolvedValue('{"name":"test"}');
      mockFs.writeFile = vi.fn().mockResolvedValue(undefined);
      mockFs.copyFile = vi.fn().mockResolvedValue(undefined);

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
      mockFs.readFile = vi.fn().mockResolvedValue('{"name":"test"}');
      mockFs.writeFile = vi.fn().mockResolvedValue(undefined);
      mockFs.copyFile = vi.fn().mockResolvedValue(undefined);

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
      mockFs.readFile = vi.fn().mockResolvedValue('{"name":"test"}');
      mockFs.writeFile = vi.fn().mockResolvedValue(undefined);
      mockFs.copyFile = vi.fn().mockResolvedValue(undefined);
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

  describe('generatePackageJson', () => {
    it('should skip writing package.json when generatePackageJson is false', async () => {
      const config = mockValidatedConfig();
      const compilerCtx = mockCompilerCtx(config);
      const buildCtx = mockBuildCtx(config, compilerCtx);

      const mockFs = compilerCtx.fs;
      mockFs.readFile = vi.fn().mockResolvedValue('{"name":"test"}');
      mockFs.writeFile = vi.fn().mockResolvedValue(undefined);
      mockFs.copyFile = vi.fn().mockResolvedValue(undefined);

      const outputTarget: d.OutputTargetHydrate = {
        type: 'dist-hydrate-script',
        dir: path.join(config.rootDir, 'dist', 'hydrate'),
        generatePackageJson: false,
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

      const [validatedOutputTarget] = validateHydrateScript(config, [outputTarget]);

      await writeHydrateOutputs(config, compilerCtx, buildCtx, [validatedOutputTarget], rollupOutput as any);

      expect(mockFs.copyFile).toHaveBeenCalled();
      expect(mockFs.writeFile).not.toHaveBeenCalledWith(
        expect.stringMatching(/dist[\\/]+hydrate[\\/]+package\.json$/),
        expect.any(String),
      );
    });

    it('should write package.json by default after validation', async () => {
      const config = mockValidatedConfig();
      const compilerCtx = mockCompilerCtx(config);
      const buildCtx = mockBuildCtx(config, compilerCtx);

      const mockFs = compilerCtx.fs;
      mockFs.readFile = vi.fn().mockResolvedValue('{"name":"test"}');
      mockFs.writeFile = vi.fn().mockResolvedValue(undefined);
      mockFs.copyFile = vi.fn().mockResolvedValue(undefined);

      const outputTarget: d.OutputTargetHydrate = {
        type: 'dist-hydrate-script',
        dir: path.join(config.rootDir, 'dist', 'hydrate'),
        // generatePackageJson is undefined, should default to true after validation
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

      const [validatedOutputTarget] = validateHydrateScript(config, [outputTarget]);

      await writeHydrateOutputs(config, compilerCtx, buildCtx, [validatedOutputTarget], rollupOutput as any);

      expect(mockFs.copyFile).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/dist[\\/]+hydrate[\\/]+package\.json$/),
        expect.stringContaining('"name"'),
      );
    });
  });
});
