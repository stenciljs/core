import path from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockConfig, mockLoadConfigInit } from '../../../testing';
import {
  ASSETS,
  COPY,
  DIST_LAZY,
  join,
  LOADER_BUNDLE,
  STENCIL_REBUNDLE,
  TYPES,
} from '../../../utils';
import { validateConfig } from '../validate-config';

describe('validateLoaderBundleOutputTarget', () => {
  // use Node's resolve() here to simulate a user using either Win/Posix separators (depending on the platform these
  // tests are run on)
  const rootDir = path.resolve('/');

  let userConfig: d.Config;
  beforeEach(() => {
    userConfig = mockConfig({ fsNamespace: 'testing' });
  });

  it('should set loader-bundle values (dev mode - browser bundle only)', () => {
    const outputTarget: d.OutputTargetLoaderBundle = {
      type: LOADER_BUNDLE,
      dir: 'my-dist',
      buildDir: 'my-build',
      empty: false,
      cjs: true,
    };
    userConfig.outputTargets = [outputTarget];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    // In dev mode, only browser bundle is generated (no distribution bundles)
    expect(config.outputTargets).toEqual([
      {
        type: ASSETS,
        dir: join(rootDir, 'dist', 'assets'),
        skipInDev: false,
      },
      {
        buildDir: join(rootDir, 'my-dist', 'my-build'),
        cjs: true,
        copy: [],
        dir: join(rootDir, 'my-dist'),
        empty: false,
        loaderPath: 'loader',
        type: LOADER_BUNDLE,
        skipInDev: true,
      },
      {
        type: DIST_LAZY,
        esmDir: join(rootDir, 'my-dist', 'my-build', 'testing'),
        isBrowserBuild: true,
        empty: false,
      },
      {
        type: COPY,
        dir: join(rootDir, 'my-dist', 'my-build', 'testing'),
        copy: [],
      },
    ]);
  });

  it('should generate distribution bundles in production mode', () => {
    const prodConfig = mockConfig({ devMode: false, fsNamespace: 'testing' });
    const outputTarget: d.OutputTargetLoaderBundle = {
      type: LOADER_BUNDLE,
      dir: 'my-dist',
      buildDir: 'my-build',
      empty: false,
      cjs: true,
    };
    prodConfig.outputTargets = [outputTarget];
    const { config } = validateConfig(prodConfig, mockLoadConfigInit());

    // In production mode, distribution bundles ARE generated
    const distLazyOutputs = config.outputTargets.filter((o) => o.type === DIST_LAZY);
    expect(distLazyOutputs).toHaveLength(2); // browser bundle + distribution bundle

    const distributionBundle = distLazyOutputs.find(
      (o) => (o as d.OutputTargetDistLazy).esmIndexFile,
    ) as d.OutputTargetDistLazy;
    expect(distributionBundle).toBeDefined();
    expect(distributionBundle.esmDir).toBe(join(rootDir, 'my-dist', 'esm'));
    expect(distributionBundle.cjsDir).toBe(join(rootDir, 'my-dist', 'cjs'));
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

  it('defaults skipInDev to true (distribution bundles skip in dev, browser bundle always builds)', () => {
    const outputTarget: d.OutputTargetLoaderBundle = {
      type: LOADER_BUNDLE,
    };
    userConfig.outputTargets = [outputTarget];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const validated = config.outputTargets.find(
      (o) => o.type === LOADER_BUNDLE,
    ) as d.OutputTargetLoaderBundle;
    expect(validated.skipInDev).toBe(true);
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

    it('auto-generates stencil-rebundle alongside loader-bundle in production mode', () => {
      prodConfig.outputTargets = [{ type: LOADER_BUNDLE }];
      const { config } = validateConfig(prodConfig, mockLoadConfigInit());
      expect(config.outputTargets.some((o) => o.type === STENCIL_REBUNDLE)).toBe(true);
    });

    it('does not duplicate types if already explicitly configured', () => {
      prodConfig.outputTargets = [{ type: LOADER_BUNDLE }, { type: TYPES, dir: 'my-types' }];
      const { config } = validateConfig(prodConfig, mockLoadConfigInit());
      expect(config.outputTargets.filter((o) => o.type === TYPES)).toHaveLength(1);
    });

    it('does not auto-generate types or stencil-rebundle in dev mode', () => {
      const devConfig = mockConfig({ devMode: true, fsNamespace: 'testing' });
      devConfig.outputTargets = [{ type: LOADER_BUNDLE }];
      const { config } = validateConfig(devConfig, mockLoadConfigInit());
      expect(config.outputTargets.some((o) => o.type === TYPES)).toBe(false);
      expect(config.outputTargets.some((o) => o.type === STENCIL_REBUNDLE)).toBe(false);
    });
  });
});
