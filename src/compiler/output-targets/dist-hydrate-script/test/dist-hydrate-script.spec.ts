import type * as d from '@stencil/core/declarations';
import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import path from 'path';

import { validateHydrateScript } from '../../../config/outputs/validate-hydrate-script';
import * as optimizeModuleMod from '../../../optimize/optimize-module';
import { HYDRATE_FACTORY_INTRO, HYDRATE_FACTORY_OUTRO } from '../hydrate-factory-closure';
import { writeHydrateOutputs } from '../write-hydrate-outputs';

describe('dist-hydrate-script', () => {
  it('evaluates the hydrate app closure once per window', () => {
    const createHydrateFactory = new Function(
      '$stencilTagTransform',
      'closureEvaluated',
      `${HYDRATE_FACTORY_INTRO.replace('export function', 'function')}
        closureEvaluated();
        function hydrateApp(window, opts) {
          opts.hydratedWindow = window;
        }
      ${HYDRATE_FACTORY_OUTRO}
      return hydrateFactory;`,
    );
    const closureEvaluated = jest.fn();
    const hydrateFactory = createHydrateFactory(
      { setTagTransformer: jest.fn(), transformTag: jest.fn() },
      closureEvaluated,
    );
    const firstWindow = mockWindow();
    const secondWindow = mockWindow();
    const firstOptions: any = {};
    const secondOptions: any = {};
    const thirdOptions: any = {};

    hydrateFactory(firstWindow, firstOptions);
    hydrateFactory(firstWindow, secondOptions);
    hydrateFactory(secondWindow, thirdOptions);

    expect(closureEvaluated).toHaveBeenCalledTimes(2);
    expect(firstOptions.hydratedWindow).toBe(firstWindow);
    expect(secondOptions.hydratedWindow).toBe(firstWindow);
    expect(thirdOptions.hydratedWindow).toBe(secondWindow);
  });

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

  describe('generatePackageJson', () => {
    it('should skip writing package.json when generatePackageJson is false', async () => {
      const config = mockValidatedConfig();
      const compilerCtx = mockCompilerCtx(config);
      const buildCtx = mockBuildCtx(config, compilerCtx);

      const mockFs = compilerCtx.fs;
      mockFs.readFile = jest.fn().mockResolvedValue('{"name":"test"}');
      mockFs.writeFile = jest.fn().mockResolvedValue(undefined);
      mockFs.copyFile = jest.fn().mockResolvedValue(undefined);

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
      mockFs.readFile = jest.fn().mockResolvedValue('{"name":"test"}');
      mockFs.writeFile = jest.fn().mockResolvedValue(undefined);
      mockFs.copyFile = jest.fn().mockResolvedValue(undefined);

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

function mockWindow() {
  const fn = jest.fn();
  return {
    addEventListener: fn,
    alert: fn,
    blur: fn,
    cancelAnimationFrame: fn,
    cancelIdleCallback: fn,
    clearInterval: fn,
    clearTimeout: fn,
    confirm: fn,
    dispatchEvent: fn,
    document: {},
    focus: fn,
    getComputedStyle: fn,
    matchMedia: fn,
    open: fn,
    prompt: fn,
    removeEventListener: fn,
    requestAnimationFrame: fn,
    requestIdleCallback: fn,
    setInterval: fn,
    setTimeout: fn,
  };
}
