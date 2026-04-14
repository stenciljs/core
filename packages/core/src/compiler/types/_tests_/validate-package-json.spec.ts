import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import type * as d from '@stencil/core';

import { getPackageJsonRecommendations, validatePackageJson } from '../validate-package-json';

describe('validatePackageJson', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;

  beforeEach(() => {
    config = mockValidatedConfig({
      validatePackageJson: true,
      outputTargets: [],
    });

    compilerCtx = mockCompilerCtx(config);
    compilerCtx.fs.accessSync = () => true;

    buildCtx = mockBuildCtx(config, compilerCtx);
    buildCtx.packageJson.module = 'dist/loader-bundle/index.js';
    buildCtx.packageJson.types = 'dist/types/index.d.ts';
  });

  describe('getPackageJsonRecommendations', () => {
    it('should return null values when no distributable outputs are configured', () => {
      config.outputTargets = [];

      const recommendations = getPackageJsonRecommendations(config);

      expect(recommendations.module).toBeNull();
      expect(recommendations.types).toBeNull();
      expect(recommendations.main).toBeNull();
    });

    it('should recommend loader-bundle paths when only loader-bundle is configured', () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          esmLoaderPath: '/dist/loader-bundle/loader',
          copy: [],
          empty: true,
          cjs: false,
          skipInDev: false,
        },
      ];

      const recommendations = getPackageJsonRecommendations(config);

      expect(recommendations.module).toBe('./dist/loader-bundle/index.js');
      expect(recommendations.types).toBeNull(); // No types output configured
      expect(recommendations.main).toBeNull(); // CJS not enabled
    });

    it('should recommend loader-bundle main path when cjs is enabled', () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          esmLoaderPath: '/dist/loader-bundle/loader',
          copy: [],
          empty: true,
          cjs: true,
          skipInDev: false,
        },
      ];

      const recommendations = getPackageJsonRecommendations(config);

      expect(recommendations.main).toBe('./dist/loader-bundle/index.cjs.js');
    });

    it('should recommend standalone paths when only standalone is configured', () => {
      config.outputTargets = [
        {
          type: 'standalone',
          dir: '/dist/standalone',
        },
      ];

      const recommendations = getPackageJsonRecommendations(config);

      expect(recommendations.module).toBe('./dist/standalone/index.js');
      expect(recommendations.types).toBeNull(); // No types output configured
    });

    it('should recommend types path from types output target', () => {
      config.outputTargets = [
        {
          type: 'types',
          dir: '/dist/types',
          empty: true,
          skipInDev: true,
        },
      ];

      const recommendations = getPackageJsonRecommendations(config);

      expect(recommendations.types).toBe('./dist/types/index.d.ts');
    });

    it('should prefer loader-bundle over standalone for module path', () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          esmLoaderPath: '/dist/loader-bundle/loader',
          copy: [],
          empty: true,
          cjs: false,
          skipInDev: false,
        },
        {
          type: 'standalone',
          dir: '/dist/standalone',
        },
      ];

      const recommendations = getPackageJsonRecommendations(config);

      expect(recommendations.module).toBe('./dist/loader-bundle/index.js');
    });
  });

  describe('validatePackageJson', () => {
    it('should not validate when validatePackageJson is false', () => {
      config.validatePackageJson = false;
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          esmLoaderPath: '/dist/loader-bundle/loader',
          copy: [],
          empty: true,
          cjs: false,
          skipInDev: false,
        },
      ];
      buildCtx.packageJson.module = 'wrong/path.js';

      validatePackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(0);
    });

    it('should not validate when no distributable outputs are configured', () => {
      config.validatePackageJson = true;
      config.outputTargets = [];

      validatePackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(0);
    });

    it('should warn when module path is missing', () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          esmLoaderPath: '/dist/loader-bundle/loader',
          copy: [],
          empty: true,
          cjs: false,
          skipInDev: false,
        },
      ];
      delete buildCtx.packageJson.module;

      validatePackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toBe('warn');
      expect(buildCtx.diagnostics[0].messageText).toContain(
        'package.json "module" property is required',
      );
    });

    it('should warn when module path does not match recommended', () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          esmLoaderPath: '/dist/loader-bundle/loader',
          copy: [],
          empty: true,
          cjs: false,
          skipInDev: false,
        },
      ];
      buildCtx.packageJson.module = 'wrong/path/index.js';

      validatePackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toBe('warn');
      expect(buildCtx.diagnostics[0].messageText).toContain('./dist/loader-bundle/index.js');
    });

    it('should not warn when module path matches recommended', () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          esmLoaderPath: '/dist/loader-bundle/loader',
          copy: [],
          empty: true,
          cjs: false,
          skipInDev: false,
        },
      ];
      buildCtx.packageJson.module = './dist/loader-bundle/index.js';

      validatePackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(0);
    });

    it('should warn when types path is missing', () => {
      config.outputTargets = [
        {
          type: 'types',
          dir: '/dist/types',
          empty: true,
          skipInDev: true,
        },
      ];
      delete buildCtx.packageJson.types;

      validatePackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toBe('warn');
      expect(buildCtx.diagnostics[0].messageText).toContain(
        'package.json "types" property is required',
      );
    });

    it('should warn when types path does not end with .d.ts', () => {
      config.outputTargets = [
        {
          type: 'types',
          dir: '/dist/types',
          empty: true,
          skipInDev: true,
        },
      ];
      buildCtx.packageJson.types = 'dist/types/index.ts';

      validatePackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toBe('warn');
      expect(buildCtx.diagnostics[0].messageText).toContain('must have a ".d.ts" extension');
    });

    it('should error when types file does not exist', () => {
      config.outputTargets = [
        {
          type: 'types',
          dir: '/dist/types',
          empty: true,
          skipInDev: true,
        },
      ];
      buildCtx.packageJson.types = './dist/types/index.d.ts';
      compilerCtx.fs.accessSync = () => false;

      validatePackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toBe('error');
      expect(buildCtx.diagnostics[0].messageText).toContain('cannot be found');
    });

    it('should not warn when types path matches recommended', () => {
      config.outputTargets = [
        {
          type: 'types',
          dir: '/dist/types',
          empty: true,
          skipInDev: true,
        },
      ];
      buildCtx.packageJson.types = './dist/types/index.d.ts';

      validatePackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(0);
    });
  });
});
