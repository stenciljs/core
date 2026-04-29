import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as d from '@stencil/core';

import {
  mockBuildCtx,
  mockCompilerCtx,
  mockCompilerSystem,
  mockValidatedConfig,
} from '../../../testing';
import { GLOBAL_STYLE, LOADER_BUNDLE, WWW, join } from '../../../utils';
import { outputGlobalStyle } from '../output-global-style';
import * as globalStylesModule from '../../style/global-styles';

describe('outputGlobalStyle', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;

  const namespace = 'test-app';
  const cssContent = '.global-style { color: red; }';
  const inputPath = '/src/global.css';

  beforeEach(() => {
    const sys = mockCompilerSystem();
    config = mockValidatedConfig({
      fsNamespace: namespace,
      namespace: 'TestApp',
      sys,
    });
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);

    // Mock buildGlobalStyleFromInput to return CSS
    vi.spyOn(globalStylesModule, 'buildGlobalStyleFromInput').mockResolvedValue(cssContent);
    vi.spyOn(compilerCtx.fs, 'writeFile');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should return early if no global-style output targets', async () => {
      config.outputTargets = [];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      expect(compilerCtx.fs.writeFile).not.toHaveBeenCalled();
    });

    it('should return early if no input configured on output target', async () => {
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          dir: '/dist/assets',
          fileName: `${namespace}.css`,
          input: undefined, // No input
          copyToLoaderBrowser: false,
          skipInDev: false,
        },
      ];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      expect(compilerCtx.fs.writeFile).not.toHaveBeenCalled();
    });

    it('should return early if CSS build returns null', async () => {
      vi.mocked(globalStylesModule.buildGlobalStyleFromInput).mockResolvedValue(null);

      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          dir: '/dist/assets',
          fileName: `${namespace}.css`,
          input: inputPath,
          copyToLoaderBrowser: false,
          skipInDev: false,
        },
      ];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      expect(compilerCtx.fs.writeFile).not.toHaveBeenCalled();
    });

    it('should write global styles to the primary location', async () => {
      const outputDir = '/dist/assets';
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          dir: outputDir,
          fileName: `${namespace}.css`,
          input: inputPath,
          copyToLoaderBrowser: false,
          skipInDev: false,
        },
      ];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join(outputDir, `${namespace}.css`),
        cssContent,
      );
    });

    it('should use custom fileName when provided', async () => {
      const outputDir = '/dist/assets';
      const customFileName = 'custom-styles.css';
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          dir: outputDir,
          fileName: customFileName,
          input: inputPath,
          copyToLoaderBrowser: false,
          skipInDev: false,
        },
      ];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join(outputDir, customFileName),
        cssContent,
      );
    });
  });

  describe('copyToLoaderBrowser', () => {
    it('should copy to loader-bundle browser dir when copyToLoaderBrowser is true', async () => {
      const assetsDir = '/dist/assets';
      const loaderBuildDir = '/dist/loader-bundle';
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          dir: assetsDir,
          fileName: `${namespace}.css`,
          input: inputPath,
          copyToLoaderBrowser: true,
          skipInDev: false,
        },
        {
          type: LOADER_BUNDLE,
          dir: '/dist/loader-bundle',
          buildDir: loaderBuildDir,
          cjs: false,
          copy: [],
          empty: true,
          skipInDev: false,
        },
      ];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      // Primary location
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join(assetsDir, `${namespace}.css`),
        cssContent,
      );

      // Compat copy to loader-bundle browser dir
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join(loaderBuildDir, namespace, `${namespace}.css`),
        cssContent,
      );
    });

    it('should not copy to loader-bundle when copyToLoaderBrowser is false', async () => {
      const assetsDir = '/dist/assets';
      const loaderBuildDir = '/dist/loader-bundle';
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          dir: assetsDir,
          fileName: `${namespace}.css`,
          input: inputPath,
          copyToLoaderBrowser: false,
          skipInDev: false,
        },
        {
          type: LOADER_BUNDLE,
          dir: '/dist/loader-bundle',
          buildDir: loaderBuildDir,
          cjs: false,
          copy: [],
          empty: true,
          skipInDev: false,
        },
      ];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      // Primary location should be written
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join(assetsDir, `${namespace}.css`),
        cssContent,
      );

      // Loader-bundle browser dir should NOT be written
      expect(compilerCtx.fs.writeFile).not.toHaveBeenCalledWith(
        join(loaderBuildDir, namespace, `${namespace}.css`),
        cssContent,
      );
    });

    it('should not copy to loader-bundle when no loader-bundle target exists', async () => {
      const assetsDir = '/dist/assets';
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          dir: assetsDir,
          fileName: `${namespace}.css`,
          input: inputPath,
          copyToLoaderBrowser: true,
          skipInDev: false,
        },
      ];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      // Should only write to primary location
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledTimes(1);
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join(assetsDir, `${namespace}.css`),
        cssContent,
      );
    });
  });

  describe('www output target integration', () => {
    it('should copy to www build directories', async () => {
      const assetsDir = '/dist/assets';
      const wwwBuildDir = '/www/build';
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          dir: assetsDir,
          fileName: `${namespace}.css`,
          input: inputPath,
          copyToLoaderBrowser: false,
          skipInDev: false,
        },
        {
          type: WWW,
          dir: '/www',
          buildDir: wwwBuildDir,
          appDir: '/www',
          indexHtml: '/www/index.html',
          empty: true,
          copy: [],
          prerenderConfig: null,
        } as d.OutputTargetWww,
      ];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      // Primary location
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join(assetsDir, `${namespace}.css`),
        cssContent,
      );

      // www build dir
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join(wwwBuildDir, `${namespace}.css`),
        cssContent,
      );
    });

    it('should copy to multiple www targets', async () => {
      const assetsDir = '/dist/assets';
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          dir: assetsDir,
          fileName: `${namespace}.css`,
          input: inputPath,
          copyToLoaderBrowser: false,
          skipInDev: false,
        },
        {
          type: WWW,
          dir: '/www1',
          buildDir: '/www1/build',
          appDir: '/www1',
          indexHtml: '/www1/index.html',
          empty: true,
          copy: [],
          prerenderConfig: null,
        } as d.OutputTargetWww,
        {
          type: WWW,
          dir: '/www2',
          buildDir: '/www2/build',
          appDir: '/www2',
          indexHtml: '/www2/index.html',
          empty: true,
          copy: [],
          prerenderConfig: null,
        } as d.OutputTargetWww,
      ];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join('/www1/build', `${namespace}.css`),
        cssContent,
      );
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join('/www2/build', `${namespace}.css`),
        cssContent,
      );
    });
  });

  describe('multiple global-style targets', () => {
    it('should handle multiple global-style output targets with different inputs', async () => {
      const css1 = '.style1 { color: red; }';
      const css2 = '.style2 { color: blue; }';

      // Mock different CSS for different inputs
      vi.mocked(globalStylesModule.buildGlobalStyleFromInput).mockImplementation(
        async (_config, _ctx, _buildCtx, inputPath) => {
          if (inputPath === '/src/global1.css') return css1;
          if (inputPath === '/src/global2.css') return css2;
          return null;
        },
      );

      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          dir: '/dist/assets',
          fileName: 'global1.css',
          input: '/src/global1.css',
          copyToLoaderBrowser: false,
          skipInDev: false,
        },
        {
          type: GLOBAL_STYLE,
          dir: '/dist/assets',
          fileName: 'global2.css',
          input: '/src/global2.css',
          copyToLoaderBrowser: false,
          skipInDev: false,
        },
      ];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join('/dist/assets', 'global1.css'),
        css1,
      );
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join('/dist/assets', 'global2.css'),
        css2,
      );
    });

    it('should handle multiple global-style targets with same input (uses cache)', async () => {
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          dir: '/dist/assets1',
          fileName: `${namespace}.css`,
          input: inputPath,
          copyToLoaderBrowser: false,
          skipInDev: false,
        },
        {
          type: GLOBAL_STYLE,
          dir: '/dist/assets2',
          fileName: `${namespace}.css`,
          input: inputPath,
          copyToLoaderBrowser: false,
          skipInDev: false,
        },
      ];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      // Both should be written
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join('/dist/assets1', `${namespace}.css`),
        cssContent,
      );
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join('/dist/assets2', `${namespace}.css`),
        cssContent,
      );

      // buildGlobalStyleFromInput was called twice, but the actual implementation
      // would use cache for the second call (same input path)
      expect(globalStylesModule.buildGlobalStyleFromInput).toHaveBeenCalledTimes(2);
    });
  });

  describe('combined scenarios', () => {
    it('should handle all output locations together', async () => {
      const assetsDir = '/dist/assets';
      const loaderBuildDir = '/dist/loader-bundle';
      const wwwBuildDir = '/www/build';

      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          dir: assetsDir,
          fileName: `${namespace}.css`,
          input: inputPath,
          copyToLoaderBrowser: true,
          skipInDev: false,
        },
        {
          type: LOADER_BUNDLE,
          dir: '/dist/loader-bundle',
          buildDir: loaderBuildDir,
          cjs: false,
          copy: [],
          empty: true,
          skipInDev: false,
        },
        {
          type: WWW,
          dir: '/www',
          buildDir: wwwBuildDir,
          appDir: '/www',
          indexHtml: '/www/index.html',
          empty: true,
          copy: [],
          prerenderConfig: null,
        } as d.OutputTargetWww,
      ];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      // Primary location
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join(assetsDir, `${namespace}.css`),
        cssContent,
      );

      // Loader-bundle compat copy
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join(loaderBuildDir, namespace, `${namespace}.css`),
        cssContent,
      );

      // www build dir
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join(wwwBuildDir, `${namespace}.css`),
        cssContent,
      );

      // Total: 3 writes
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledTimes(3);
    });
  });
});
