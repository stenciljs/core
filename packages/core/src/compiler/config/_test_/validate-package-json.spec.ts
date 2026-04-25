import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import type * as d from '@stencil/core';

import { validateBuildPackageJson } from '../validate-package-json';

describe('validateBuildPackageJson', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;

  beforeEach(() => {
    config = mockValidatedConfig({
      outputTargets: [],
    });

    compilerCtx = mockCompilerCtx(config);
    compilerCtx.fs.accessSync = () => true;

    buildCtx = mockBuildCtx(config, compilerCtx);
    buildCtx.packageJson.module = 'dist/loader-bundle/index.js';
    buildCtx.packageJson.types = 'dist/types/index.d.ts';
    buildCtx.packageJson.type = 'module';
  });

  it('should not validate when no distributable outputs are configured', async () => {
    config.outputTargets = [];

    await validateBuildPackageJson(config, compilerCtx, buildCtx);

    expect(buildCtx.diagnostics.length).toBe(0);
  });

  it('should not validate in watch mode', async () => {
    config.watch = true;
    config.outputTargets = [
      {
        type: 'loader-bundle',
        dir: '/dist/loader-bundle',
        buildDir: '/dist/loader-bundle',
        copy: [],
        empty: true,
        cjs: false,
        skipInDev: false,
      },
    ];
    buildCtx.packageJson.module = 'wrong/path.js';

    await validateBuildPackageJson(config, compilerCtx, buildCtx);

    expect(buildCtx.diagnostics.length).toBe(0);
  });

  describe('module field', () => {
    it('should warn when module path is missing', async () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          copy: [],
          empty: true,
          cjs: false,
          skipInDev: false,
        },
      ];
      delete buildCtx.packageJson.module;

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toBe('warn');
      expect(buildCtx.diagnostics[0].messageText).toContain(
        'package.json "module" property is required',
      );
    });

    it('should warn when module path does not exist', async () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          copy: [],
          empty: true,
          cjs: false,
          skipInDev: false,
        },
      ];
      buildCtx.packageJson.module = 'wrong/path/index.js';
      compilerCtx.fs.accessSync = () => false;

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toBe('warn');
      expect(buildCtx.diagnostics[0].messageText).toContain("doesn't exist");
      expect(buildCtx.diagnostics[0].messageText).toContain('./dist/loader-bundle/index.js');
    });

    it('should not warn when module path exists but differs from recommended', async () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          copy: [],
          empty: true,
          cjs: false,
          skipInDev: false,
        },
      ];
      buildCtx.packageJson.module = 'custom/path/index.js';
      compilerCtx.fs.accessSync = () => true;

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(0);
    });

    it('should not warn when module path matches recommended', async () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          copy: [],
          empty: true,
          cjs: false,
          skipInDev: false,
        },
      ];
      buildCtx.packageJson.module = './dist/loader-bundle/index.js';

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(0);
    });

    it('should recommend standalone paths when only standalone is configured', async () => {
      config.outputTargets = [
        {
          type: 'standalone',
          dir: '/dist/standalone',
        },
      ];
      delete buildCtx.packageJson.module;

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      const moduleWarning = buildCtx.diagnostics.find((d) => d.messageText.includes('"module"'));
      expect(moduleWarning).toBeDefined();
      expect(moduleWarning!.messageText).toContain('./dist/standalone/index.js');
    });

    it('should prefer loader-bundle over standalone for module path', async () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
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
      delete buildCtx.packageJson.module;

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      const moduleWarning = buildCtx.diagnostics.find((d) => d.messageText.includes('"module"'));
      expect(moduleWarning).toBeDefined();
      expect(moduleWarning!.messageText).toContain('./dist/loader-bundle/index.js');
    });
  });

  describe('types field', () => {
    it('should warn when types path is missing', async () => {
      config.outputTargets = [
        {
          type: 'types',
          dir: '/dist/types',
          empty: true,
          skipInDev: true,
        },
      ];
      delete buildCtx.packageJson.types;

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toBe('warn');
      expect(buildCtx.diagnostics[0].messageText).toContain(
        'package.json "types" property is required',
      );
    });

    it('should warn when types path does not end with .d.ts', async () => {
      config.outputTargets = [
        {
          type: 'types',
          dir: '/dist/types',
          empty: true,
          skipInDev: true,
        },
      ];
      buildCtx.packageJson.types = 'dist/types/index.ts';

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toBe('warn');
      expect(buildCtx.diagnostics[0].messageText).toContain('must have a ".d.ts" extension');
    });

    it('should error when types file does not exist', async () => {
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

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toBe('error');
      expect(buildCtx.diagnostics[0].messageText).toContain("doesn't exist");
    });

    it('should not warn when types path exists but differs from recommended', async () => {
      config.outputTargets = [
        {
          type: 'types',
          dir: '/dist/types',
          empty: true,
          skipInDev: true,
        },
      ];
      buildCtx.packageJson.types = './dist/types/custom.d.ts';
      compilerCtx.fs.accessSync = () => true;

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(0);
    });

    it('should not warn when types path matches recommended', async () => {
      config.outputTargets = [
        {
          type: 'types',
          dir: '/dist/types',
          empty: true,
          skipInDev: true,
        },
      ];
      buildCtx.packageJson.types = './dist/types/index.d.ts';

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(0);
    });
  });

  describe('main field', () => {
    it('should warn when main is missing but CJS output is enabled', async () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          copy: [],
          empty: true,
          cjs: true,
          skipInDev: false,
        },
      ];
      delete buildCtx.packageJson.main;

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      const mainWarning = buildCtx.diagnostics.find((d) => d.messageText.includes('"main"'));
      expect(mainWarning).toBeDefined();
      expect(mainWarning!.level).toBe('warn');
      expect(mainWarning!.messageText).toContain('./dist/loader-bundle/index.cjs');
    });

    it('should warn when main does not exist (CJS enabled)', async () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          copy: [],
          empty: true,
          cjs: true,
          skipInDev: false,
        },
      ];
      buildCtx.packageJson.main = 'wrong/path.js';
      compilerCtx.fs.accessSync = () => false;

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      const mainWarning = buildCtx.diagnostics.find((d) => d.messageText.includes('"main"'));
      expect(mainWarning).toBeDefined();
      expect(mainWarning!.level).toBe('warn');
      expect(mainWarning!.messageText).toContain("doesn't exist");
    });

    it('should not warn when main exists but differs from recommended', async () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          copy: [],
          empty: true,
          cjs: true,
          skipInDev: false,
        },
      ];
      buildCtx.packageJson.main = 'custom/path.cjs';
      compilerCtx.fs.accessSync = () => true;

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      const mainWarning = buildCtx.diagnostics.find((d) => d.messageText.includes('"main"'));
      expect(mainWarning).toBeUndefined();
    });

    it('should warn when main does not exist (CJS not enabled)', async () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          copy: [],
          empty: true,
          cjs: false,
          skipInDev: false,
        },
      ];
      buildCtx.packageJson.main = 'dist/index.cjs';
      compilerCtx.fs.accessSync = () => false;

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      const mainWarning = buildCtx.diagnostics.find((d) => d.messageText.includes('"main"'));
      expect(mainWarning).toBeDefined();
      expect(mainWarning!.level).toBe('warn');
      expect(mainWarning!.messageText).toContain("doesn't exist");
    });

    it('should not warn about main when CJS is not enabled', async () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          copy: [],
          empty: true,
          cjs: false,
          skipInDev: false,
        },
      ];
      delete buildCtx.packageJson.main;

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      const mainWarning = buildCtx.diagnostics.find((d) => d.messageText.includes('"main"'));
      expect(mainWarning).toBeUndefined();
    });
  });

  describe('type field', () => {
    it('should warn when type is not "module" and only ESM output is configured', async () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          copy: [],
          empty: true,
          cjs: false,
          skipInDev: false,
        },
      ];
      buildCtx.packageJson.module = './dist/loader-bundle/index.js';
      delete buildCtx.packageJson.type;

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      const typeWarning = buildCtx.diagnostics.find((d) => d.messageText.includes('"type"'));
      expect(typeWarning).toBeDefined();
      expect(typeWarning!.level).toBe('warn');
      expect(typeWarning!.messageText).toContain('"module"');
    });

    it('should warn about type when CJS output is enabled but type is not module', async () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          copy: [],
          empty: true,
          cjs: true,
          skipInDev: false,
        },
      ];
      buildCtx.packageJson.module = './dist/loader-bundle/index.js';
      buildCtx.packageJson.main = './dist/loader-bundle/index.cjs';
      delete buildCtx.packageJson.type;

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      // In v5, we always recommend type: "module" - CJS uses .cjs extension which works regardless
      const typeWarning = buildCtx.diagnostics.find((d) => d.messageText.includes('"type"'));
      expect(typeWarning).toBeDefined();
      expect(typeWarning!.level).toBe('warn');
      expect(typeWarning!.messageText).toContain('"module"');
    });

    it('should not warn about type when type is "module" with CJS output', async () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          copy: [],
          empty: true,
          cjs: true,
          skipInDev: false,
        },
      ];
      buildCtx.packageJson.module = './dist/loader-bundle/index.js';
      buildCtx.packageJson.main = './dist/loader-bundle/index.cjs';
      buildCtx.packageJson.type = 'module';

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      const typeWarning = buildCtx.diagnostics.find((d) => d.messageText.includes('"type"'));
      expect(typeWarning).toBeUndefined();
    });

    it('should not warn when type is "module" and only ESM output is configured', async () => {
      config.outputTargets = [
        {
          type: 'loader-bundle',
          dir: '/dist/loader-bundle',
          buildDir: '/dist/loader-bundle',
          copy: [],
          empty: true,
          cjs: false,
          skipInDev: false,
        },
      ];
      buildCtx.packageJson.module = './dist/loader-bundle/index.js';
      buildCtx.packageJson.type = 'module';

      await validateBuildPackageJson(config, compilerCtx, buildCtx);

      const typeWarning = buildCtx.diagnostics.find((d) => d.messageText.includes('"type"'));
      expect(typeWarning).toBeUndefined();
    });
  });
});
