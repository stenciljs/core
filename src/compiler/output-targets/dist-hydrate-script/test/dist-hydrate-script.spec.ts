import type * as d from '@stencil/core/declarations';
import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import path from 'path';

import { validateHydrateScript } from '../../../config/outputs/validate-hydrate-script';
import * as optimizeModuleMod from '../../../optimize/optimize-module';
import { HYDRATE_FACTORY_INTRO, HYDRATE_FACTORY_OUTRO } from '../hydrate-factory-closure';
import { writeHydrateOutputs } from '../write-hydrate-outputs';

describe('dist-hydrate-script', () => {
  it('evaluates the hydrate app closure once per window and shadow mode', () => {
    const createHydrateFactory = new Function(
      '$stencilTagTransform',
      'closureEvaluated',
      `${HYDRATE_FACTORY_INTRO.replace('export function', 'function')}
        closureEvaluated();
        function hydrateApp(window, opts) {
          opts.hydratedWindow = window;
          opts.hydratedMode = modeResolutionChain.map((handler) => handler()).find((mode) => mode);
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
    const firstOptions: any = { modes: [() => 'ios'], serializeShadowRoot: 'declarative-shadow-dom' };
    const secondOptions: any = { modes: [() => 'md'], serializeShadowRoot: 'declarative-shadow-dom' };
    const thirdOptions: any = { modes: [() => 'scoped'], serializeShadowRoot: 'scoped' };
    const fourthOptions: any = {
      modes: [() => 'second-window'],
      serializeShadowRoot: 'declarative-shadow-dom',
    };
    const fifthOptions: any = { serializeShadowRoot: 'declarative-shadow-dom' };

    hydrateFactory(firstWindow, firstOptions);
    hydrateFactory(firstWindow, secondOptions);
    hydrateFactory(firstWindow, thirdOptions);
    hydrateFactory(secondWindow, fourthOptions);
    hydrateFactory(firstWindow, fifthOptions);

    expect(closureEvaluated).toHaveBeenCalledTimes(3);
    expect(firstOptions.hydratedWindow).toBe(firstWindow);
    expect(firstOptions.hydratedMode).toBe('ios');
    expect(secondOptions.hydratedWindow).toBe(firstWindow);
    expect(secondOptions.hydratedMode).toBe('md');
    expect(thirdOptions.hydratedWindow).toBe(firstWindow);
    expect(thirdOptions.hydratedMode).toBe('scoped');
    expect(fourthOptions.hydratedWindow).toBe(secondWindow);
    expect(fourthOptions.hydratedMode).toBe('second-window');
    expect(fifthOptions.hydratedWindow).toBe(firstWindow);
    expect(fifthOptions.hydratedMode).toBeUndefined();
  });

  it('supports non-extensible windows', () => {
    const createHydrateFactory = new Function(
      '$stencilTagTransform',
      `${HYDRATE_FACTORY_INTRO.replace('export function', 'function')}
        function hydrateApp() {}
      ${HYDRATE_FACTORY_OUTRO}
      return hydrateFactory;`,
    );
    const hydrateFactory = createHydrateFactory({ setTagTransformer: jest.fn(), transformTag: jest.fn() });
    const win = Object.preventExtensions(mockWindow());

    expect(() => hydrateFactory(win, { serializeShadowRoot: 'scoped' })).not.toThrow();
  });

  it('does not cache per-component shadow root options', () => {
    const createHydrateFactory = new Function(
      '$stencilTagTransform',
      'closureEvaluated',
      `${HYDRATE_FACTORY_INTRO.replace('export function', 'function')}
        closureEvaluated();
        function hydrateApp() {}
      ${HYDRATE_FACTORY_OUTRO}
      return hydrateFactory;`,
    );
    const closureEvaluated = jest.fn();
    const hydrateFactory = createHydrateFactory(
      { setTagTransformer: jest.fn(), transformTag: jest.fn() },
      closureEvaluated,
    );
    const win = mockWindow();
    const serializeShadowRoot = { default: 'declarative-shadow-dom' };

    hydrateFactory(win, { serializeShadowRoot });
    hydrateFactory(win, { serializeShadowRoot });

    expect(closureEvaluated).toHaveBeenCalledTimes(2);
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
    fetch: fn,
    FetchError: fn,
    focus: fn,
    getComputedStyle: fn,
    Headers: fn,
    matchMedia: fn,
    open: fn,
    prompt: fn,
    removeEventListener: fn,
    Request: fn,
    Response: fn,
    requestAnimationFrame: fn,
    requestIdleCallback: fn,
    setInterval: fn,
    setTimeout: fn,
  };
}
