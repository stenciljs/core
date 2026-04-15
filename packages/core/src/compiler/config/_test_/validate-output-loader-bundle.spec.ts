import path from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockConfig, mockLoadConfigInit } from '../../../testing';
import { join, LOADER_BUNDLE, STENCIL_META, TYPES } from '../../../utils';
import { validateConfig } from '../validate-config';

describe('validateLoaderBundleOutputTarget', () => {
  // use Node's resolve() here to simulate a user using either Win/Posix separators (depending on the platform these
  // tests are run on)
  const rootDir = path.resolve('/');

  let userConfig: d.Config;
  beforeEach(() => {
    userConfig = mockConfig({ fsNamespace: 'testing' });
  });

  it('should set loader-bundle values', () => {
    const outputTarget: d.OutputTargetLoaderBundle = {
      type: LOADER_BUNDLE,
      dir: 'my-dist',
      buildDir: 'my-build',
      empty: false,
      cjs: true,
    };
    userConfig.outputTargets = [outputTarget];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.outputTargets).toEqual([
      {
        buildDir: join(rootDir, 'my-dist', 'my-build'),
        cjs: true,
        copy: [],
        dir: join(rootDir, 'my-dist'),
        empty: false,
        esmLoaderPath: join(rootDir, 'my-dist', 'loader'),
        type: LOADER_BUNDLE,
        skipInDev: false,
      },

      {
        esmDir: join(rootDir, 'my-dist', 'my-build', 'testing'),
        empty: false,
        isBrowserBuild: true,
        type: 'dist-lazy',
      },
      {
        copyAssets: 'dist',
        copy: [],
        dir: join(rootDir, 'my-dist', 'my-build', 'testing'),
        type: 'copy',
      },
      {
        file: join(rootDir, 'my-dist', 'my-build', 'testing', 'testing.css'),
        type: 'dist-global-styles',
      },
      {
        type: 'dist-lazy',
        esmDir: join(rootDir, 'my-dist', 'esm'),
        cjsDir: join(rootDir, 'my-dist', 'cjs'),
        cjsIndexFile: join(rootDir, 'my-dist', 'index.cjs.js'),
        esmIndexFile: join(rootDir, 'my-dist', 'index.js'),
        empty: false,
      },
      {
        type: 'dist-lazy-loader',
        dir: join(rootDir, 'my-dist', 'loader'),
        esmDir: join(rootDir, 'my-dist', 'esm'),
        cjsDir: join(rootDir, 'my-dist', 'cjs'),
        componentDts: join(rootDir, 'dist', 'types', 'components.d.ts'),
        empty: false,
      },
    ]);
  });

  it('should set defaults when outputTargets loader-bundle is empty', () => {
    userConfig.outputTargets = [{ type: LOADER_BUNDLE }];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const outputTarget = config.outputTargets.find(
      (o) => o.type === LOADER_BUNDLE,
    ) as d.OutputTargetLoaderBundle;
    expect(outputTarget).toBeDefined();
    expect(outputTarget.dir).toBe(join(rootDir, 'dist', 'loader-bundle'));
    expect(outputTarget.buildDir).toBe(join(rootDir, 'dist', 'loader-bundle'));
    expect(outputTarget.empty).toBe(true);
  });

  it('should default to not add loader-bundle when outputTargets exists, but without loader-bundle', () => {
    userConfig.outputTargets = [];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.outputTargets.some((o) => o.type === LOADER_BUNDLE)).toBe(false);
  });

  it('defaults cjs to false when not specified', () => {
    const outputTarget: d.OutputTargetLoaderBundle = {
      type: LOADER_BUNDLE,
      dir: 'my-dist',
    };
    userConfig.outputTargets = [outputTarget];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const validated = config.outputTargets.find(
      (o) => o.type === LOADER_BUNDLE,
    ) as d.OutputTargetLoaderBundle;
    expect(validated.cjs).toBe(false);
  });

  it('defaults skipInDev to false', () => {
    const outputTarget: d.OutputTargetLoaderBundle = {
      type: LOADER_BUNDLE,
    };
    userConfig.outputTargets = [outputTarget];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const validated = config.outputTargets.find(
      (o) => o.type === LOADER_BUNDLE,
    ) as d.OutputTargetLoaderBundle;
    expect(validated.skipInDev).toBe(false);
  });

  describe('production mode auto-generation', () => {
    let prodConfig: d.Config;

    beforeEach(() => {
      prodConfig = mockConfig({ devMode: false, fsNamespace: 'testing' });
    });

    it('auto-generates types alongside loader-bundle in production mode', () => {
      prodConfig.outputTargets = [{ type: LOADER_BUNDLE }];
      const { config } = validateConfig(prodConfig, mockLoadConfigInit());
      expect(config.outputTargets.some((o) => o.type === TYPES)).toBe(true);
      expect(config.outputTargets.some((o) => o.type === LOADER_BUNDLE)).toBe(true);
    });

    it('auto-generates stencil-meta alongside loader-bundle in production mode', () => {
      prodConfig.outputTargets = [{ type: LOADER_BUNDLE }];
      const { config } = validateConfig(prodConfig, mockLoadConfigInit());
      expect(config.outputTargets.some((o) => o.type === STENCIL_META)).toBe(true);
    });

    it('does not duplicate types if already explicitly configured', () => {
      prodConfig.outputTargets = [{ type: LOADER_BUNDLE }, { type: TYPES, dir: 'my-types' }];
      const { config } = validateConfig(prodConfig, mockLoadConfigInit());
      expect(config.outputTargets.filter((o) => o.type === TYPES)).toHaveLength(1);
    });

    it('does not auto-generate types or stencil-meta in dev mode', () => {
      const devConfig = mockConfig({ devMode: true, fsNamespace: 'testing' });
      devConfig.outputTargets = [{ type: LOADER_BUNDLE }];
      const { config } = validateConfig(devConfig, mockLoadConfigInit());
      expect(config.outputTargets.some((o) => o.type === TYPES)).toBe(false);
      expect(config.outputTargets.some((o) => o.type === STENCIL_META)).toBe(false);
    });
  });
});
