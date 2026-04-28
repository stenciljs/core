import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import type * as d from '@stencil/core';

import {
  mockBuildCtx,
  mockCompilerCtx,
  mockCompilerSystem,
  mockValidatedConfig,
} from '../../../testing';
import { GLOBAL_STYLE, LOADER_BUNDLE, WWW, join } from '../../../utils';
import { outputGlobalStyle } from '../output-global-style';

describe('outputGlobalStyle', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;

  const namespace = 'test-app';
  const cssContent = '.global-style { color: red; }';

  beforeEach(() => {
    const sys = mockCompilerSystem();
    config = mockValidatedConfig({
      fsNamespace: namespace,
      namespace: 'TestApp',
      sys,
    });
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);

    // Set up cached global style
    compilerCtx.cachedGlobalStyle = cssContent;

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

    it('should return early if no cached global styles', async () => {
      config.outputTargets = [
        { type: GLOBAL_STYLE, dir: '/dist/assets', copyToLoaderBrowser: false, skipInDev: false },
      ];
      compilerCtx.cachedGlobalStyle = null;

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      expect(compilerCtx.fs.writeFile).not.toHaveBeenCalled();
    });

    it('should write global styles to the primary location', async () => {
      const outputDir = '/dist/assets';
      config.outputTargets = [
        { type: GLOBAL_STYLE, dir: outputDir, copyToLoaderBrowser: false, skipInDev: false },
      ];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join(outputDir, `${namespace}.css`),
        cssContent,
      );
    });
  });

  describe('copyToLoaderBrowser', () => {
    it('should copy to loader-bundle browser dir when copyToLoaderBrowser is true', async () => {
      const assetsDir = '/dist/assets';
      const loaderBuildDir = '/dist/loader-bundle';
      config.outputTargets = [
        { type: GLOBAL_STYLE, dir: assetsDir, copyToLoaderBrowser: true, skipInDev: false },
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
        { type: GLOBAL_STYLE, dir: assetsDir, copyToLoaderBrowser: false, skipInDev: false },
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
        { type: GLOBAL_STYLE, dir: assetsDir, copyToLoaderBrowser: true, skipInDev: false },
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
        { type: GLOBAL_STYLE, dir: assetsDir, copyToLoaderBrowser: false, skipInDev: false },
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
        { type: GLOBAL_STYLE, dir: assetsDir, copyToLoaderBrowser: false, skipInDev: false },
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
    it('should handle multiple global-style output targets', async () => {
      config.outputTargets = [
        { type: GLOBAL_STYLE, dir: '/dist/assets1', copyToLoaderBrowser: false, skipInDev: false },
        { type: GLOBAL_STYLE, dir: '/dist/assets2', copyToLoaderBrowser: false, skipInDev: false },
      ];

      await outputGlobalStyle(config, compilerCtx, buildCtx);

      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join('/dist/assets1', `${namespace}.css`),
        cssContent,
      );
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        join('/dist/assets2', `${namespace}.css`),
        cssContent,
      );
    });
  });

  describe('combined scenarios', () => {
    it('should handle all output locations together', async () => {
      const assetsDir = '/dist/assets';
      const loaderBuildDir = '/dist/loader-bundle';
      const wwwBuildDir = '/www/build';

      config.outputTargets = [
        { type: GLOBAL_STYLE, dir: assetsDir, copyToLoaderBrowser: true, skipInDev: false },
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
