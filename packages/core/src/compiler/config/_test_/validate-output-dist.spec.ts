import path from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockConfig, mockLoadConfigInit } from '../../../testing';
import { join, LOADER_BUNDLE } from '../../../utils';
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
        isPrimaryPackageOutputTarget: false,
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

  it('sets option to validate primary package output target when enabled', () => {
    const outputTarget: d.OutputTargetLoaderBundle = {
      type: LOADER_BUNDLE,
      dir: 'my-dist',
      buildDir: 'my-build',
      empty: false,
      isPrimaryPackageOutputTarget: true,
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
        isPrimaryPackageOutputTarget: true,
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
    ]);
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
});
