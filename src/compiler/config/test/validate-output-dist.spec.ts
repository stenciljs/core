import type * as d from '@stencil/core/declarations';
import { mockConfig, mockLoadConfigInit } from '@stencil/core/testing';
import { join } from '@utils';
import path from 'path';

import { validateConfig } from '../validate-config';

describe('validateDistOutputTarget', () => {
  // use Node's resolve() here to simulate a user using either Win/Posix separators (depending on the platform these
  // tests are run on)
  const rootDir = path.resolve('/');

  let userConfig: d.Config;
  beforeEach(() => {
    userConfig = mockConfig({ fsNamespace: 'testing' });
  });

  it('should set dist values', () => {
    const outputTarget: d.OutputTargetDist = {
      type: 'dist',
      dir: 'my-dist',
      buildDir: 'my-build',
      empty: false,
    };
    userConfig.outputTargets = [outputTarget];
    userConfig.buildDist = true;
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.outputTargets).toEqual([
      {
        buildDir: join(rootDir, 'my-dist', 'my-build'),
        collectionDir: join(rootDir, 'my-dist', 'collection'),
        copy: [],
        dir: join(rootDir, 'my-dist'),
        empty: false,
        esmLoaderPath: join(rootDir, 'my-dist', 'loader'),
        type: 'dist',
        polyfills: false,
        typesDir: join(rootDir, 'my-dist', 'types'),
        transformAliasedImportPathsInCollection: true,
        isPrimaryPackageOutputTarget: false,
      },
      {
        esmDir: join(rootDir, 'my-dist', 'my-build', 'testing'),
        empty: false,
        isBrowserBuild: true,
        legacyLoaderFile: join(rootDir, 'my-dist', 'my-build', 'testing.js'),
        polyfills: true,
        systemDir: undefined,
        systemLoaderFile: undefined,
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
        dir: join(rootDir, 'my-dist'),
        type: 'dist-types',
        typesDir: join(rootDir, 'my-dist', 'types'),
      },
      {
        collectionDir: join(rootDir, 'my-dist', 'collection'),
        dir: join(rootDir, '/my-dist'),
        empty: false,
        transformAliasedImportPaths: true,
        type: 'dist-collection',
      },
      {
        copy: [{ src: '**/*.svg' }, { src: '**/*.js' }],
        copyAssets: 'collection',
        dir: join(rootDir, 'my-dist', 'collection'),
        type: 'copy',
      },
      {
        type: 'dist-lazy',
        cjsDir: join(rootDir, 'my-dist', 'cjs'),
        cjsIndexFile: join(rootDir, 'my-dist', 'index.cjs.js'),
        empty: false,
        esmDir: join(rootDir, 'my-dist', 'esm'),
        esmEs5Dir: undefined,
        esmIndexFile: join(rootDir, 'my-dist', 'index.js'),
        polyfills: true,
      },
      {
        cjsDir: join(rootDir, 'my-dist', 'cjs'),
        componentDts: join(rootDir, 'my-dist', 'types', 'components.d.ts'),
        dir: join(rootDir, 'my-dist', 'loader'),
        empty: false,
        esmDir: join(rootDir, 'my-dist', 'esm'),
        esmEs5Dir: undefined,
        type: 'dist-lazy-loader',
      },
    ]);
  });

  it('should set defaults when outputTargets dist is empty', () => {
    userConfig.outputTargets = [{ type: 'dist' }];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    const outputTarget = config.outputTargets.find((o) => o.type === 'dist') as d.OutputTargetDist;
    expect(outputTarget).toBeDefined();
    expect(outputTarget.dir).toBe(join(rootDir, 'dist'));
    expect(outputTarget.buildDir).toBe(join(rootDir, '/dist'));
    expect(outputTarget.empty).toBe(true);
  });

  it('should default to not add dist when outputTargets exists, but without dist', () => {
    userConfig.outputTargets = [];
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    expect(config.outputTargets.some((o) => o.type === 'dist')).toBe(false);
  });

  it('sets option to transform aliased import paths when enabled', () => {
    const outputTarget: d.OutputTargetDist = {
      type: 'dist',
      dir: 'my-dist',
      buildDir: 'my-build',
      empty: false,
      transformAliasedImportPathsInCollection: true,
    };
    userConfig.outputTargets = [outputTarget];
    userConfig.buildDist = true;

    const { config } = validateConfig(userConfig, mockLoadConfigInit());

    expect(config.outputTargets).toEqual([
      {
        buildDir: join(rootDir, 'my-dist', 'my-build'),
        collectionDir: join(rootDir, 'my-dist', 'collection'),
        copy: [],
        dir: join(rootDir, 'my-dist'),
        empty: false,
        esmLoaderPath: join(rootDir, 'my-dist', 'loader'),
        type: 'dist',
        polyfills: false,
        typesDir: join(rootDir, 'my-dist', 'types'),
        transformAliasedImportPathsInCollection: true,
        isPrimaryPackageOutputTarget: false,
      },
      {
        esmDir: join(rootDir, 'my-dist', 'my-build', 'testing'),
        empty: false,
        isBrowserBuild: true,
        legacyLoaderFile: join(rootDir, 'my-dist', 'my-build', 'testing.js'),
        polyfills: true,
        systemDir: undefined,
        systemLoaderFile: undefined,
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
        dir: join(rootDir, 'my-dist'),
        type: 'dist-types',
        typesDir: join(rootDir, 'my-dist', 'types'),
      },
      {
        collectionDir: join(rootDir, 'my-dist', 'collection'),
        dir: join(rootDir, '/my-dist'),
        empty: false,
        transformAliasedImportPaths: true,
        type: 'dist-collection',
      },
      {
        copy: [{ src: '**/*.svg' }, { src: '**/*.js' }],
        copyAssets: 'collection',
        dir: join(rootDir, 'my-dist', 'collection'),
        type: 'copy',
      },
      {
        type: 'dist-lazy',
        cjsDir: join(rootDir, 'my-dist', 'cjs'),
        cjsIndexFile: join(rootDir, 'my-dist', 'index.cjs.js'),
        empty: false,
        esmDir: join(rootDir, 'my-dist', 'esm'),
        esmEs5Dir: undefined,
        esmIndexFile: join(rootDir, 'my-dist', 'index.js'),
        polyfills: true,
      },
      {
        cjsDir: join(rootDir, 'my-dist', 'cjs'),
        componentDts: join(rootDir, 'my-dist', 'types', 'components.d.ts'),
        dir: join(rootDir, 'my-dist', 'loader'),
        empty: false,
        esmDir: join(rootDir, 'my-dist', 'esm'),
        esmEs5Dir: undefined,
        type: 'dist-lazy-loader',
      },
    ]);
  });

  it('sets option to validate primary package output target when enabled', () => {
    const outputTarget: d.OutputTargetDist = {
      type: 'dist',
      dir: 'my-dist',
      buildDir: 'my-build',
      empty: false,
      isPrimaryPackageOutputTarget: true,
    };
    userConfig.outputTargets = [outputTarget];
    userConfig.buildDist = true;

    const { config } = validateConfig(userConfig, mockLoadConfigInit());

    expect(config.outputTargets).toEqual([
      {
        buildDir: join(rootDir, 'my-dist', 'my-build'),
        collectionDir: join(rootDir, 'my-dist', 'collection'),
        copy: [],
        dir: join(rootDir, 'my-dist'),
        empty: false,
        esmLoaderPath: join(rootDir, 'my-dist', 'loader'),
        type: 'dist',
        polyfills: false,
        typesDir: join(rootDir, 'my-dist', 'types'),
        transformAliasedImportPathsInCollection: true,
        isPrimaryPackageOutputTarget: true,
      },
      {
        esmDir: join(rootDir, 'my-dist', 'my-build', 'testing'),
        empty: false,
        isBrowserBuild: true,
        legacyLoaderFile: join(rootDir, 'my-dist', 'my-build', 'testing.js'),
        polyfills: true,
        systemDir: undefined,
        systemLoaderFile: undefined,
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
        dir: join(rootDir, 'my-dist'),
        type: 'dist-types',
        typesDir: join(rootDir, 'my-dist', 'types'),
      },
      {
        collectionDir: join(rootDir, 'my-dist', 'collection'),
        dir: join(rootDir, '/my-dist'),
        empty: false,
        transformAliasedImportPaths: true,
        type: 'dist-collection',
      },
      {
        copy: [{ src: '**/*.svg' }, { src: '**/*.js' }],
        copyAssets: 'collection',
        dir: join(rootDir, 'my-dist', 'collection'),
        type: 'copy',
      },
      {
        type: 'dist-lazy',
        cjsDir: join(rootDir, 'my-dist', 'cjs'),
        cjsIndexFile: join(rootDir, 'my-dist', 'index.cjs.js'),
        empty: false,
        esmDir: join(rootDir, 'my-dist', 'esm'),
        esmEs5Dir: undefined,
        esmIndexFile: join(rootDir, 'my-dist', 'index.js'),
        polyfills: true,
      },
      {
        cjsDir: join(rootDir, 'my-dist', 'cjs'),
        componentDts: join(rootDir, 'my-dist', 'types', 'components.d.ts'),
        dir: join(rootDir, 'my-dist', 'loader'),
        empty: false,
        esmDir: join(rootDir, 'my-dist', 'esm'),
        esmEs5Dir: undefined,
        type: 'dist-lazy-loader',
      },
    ]);
  });
});
