import type * as d from '@stencil/core/declarations';
import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import { normalizePath } from '@utils';
import path from 'path';

import * as v from '../validate-build-package-json';

describe('validate-package-json', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;
  let collectionOutputTarget: d.OutputTargetDistCollection;
  const root = path.resolve('/');

  beforeEach(async () => {
    collectionOutputTarget = {
      type: 'dist-collection',
      dir: '/dist',
      collectionDir: '/dist/collection',
    };

    const namespace = 'SomeNamespace';
    config = mockValidatedConfig({
      devMode: false,
      fsNamespace: namespace.toLowerCase(),
      namespace,
      packageJsonFilePath: path.join(root, 'package.json'),
    });
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);
    buildCtx.packageJson = {};
    await compilerCtx.fs.writeFile(config.packageJsonFilePath, JSON.stringify(buildCtx.packageJson));
  });

  describe('files', () => {
    it('should validate files "dist/"', async () => {
      const distPath = path.join(root, 'dist');
      await compilerCtx.fs.emptyDirs([distPath]);
      await compilerCtx.fs.commit();
      buildCtx.packageJson.files = ['dist/'];
      await v.validatePackageFiles(config, compilerCtx, buildCtx, collectionOutputTarget);
      expect(buildCtx.diagnostics).toHaveLength(0);
    });

    it('should validate files "./dist/"', async () => {
      const distPath = path.join(root, 'dist');
      await compilerCtx.fs.emptyDirs([distPath]);
      await compilerCtx.fs.commit();
      buildCtx.packageJson.files = ['./dist/'];
      await v.validatePackageFiles(config, compilerCtx, buildCtx, collectionOutputTarget);
      expect(buildCtx.diagnostics).toHaveLength(0);
    });

    it('should validate files "./dist"', async () => {
      const distPath = path.join(root, 'dist');
      await compilerCtx.fs.emptyDirs([distPath]);
      await compilerCtx.fs.commit();
      buildCtx.packageJson.files = ['./dist'];
      await v.validatePackageFiles(config, compilerCtx, buildCtx, collectionOutputTarget);
      expect(buildCtx.diagnostics).toHaveLength(0);
    });

    it('should validate files "dist"', async () => {
      const distPath = path.join(root, 'dist');
      await compilerCtx.fs.emptyDirs([distPath]);
      await compilerCtx.fs.commit();
      buildCtx.packageJson.files = ['dist'];
      await v.validatePackageFiles(config, compilerCtx, buildCtx, collectionOutputTarget);
      expect(buildCtx.diagnostics).toHaveLength(0);
    });

    it('should error when files array misses dist/', async () => {
      buildCtx.packageJson.files = [];
      await v.validatePackageFiles(config, compilerCtx, buildCtx, collectionOutputTarget);
      expect(buildCtx.diagnostics[0].messageText).toMatch(/array must contain the distribution directory/);
      expect(buildCtx.diagnostics[0].messageText).toMatch(/"dist\/"/);
    });
  });

  describe('main', () => {
    it('main cannot be the old loader', async () => {
      compilerCtx.fs.writeFile(path.join(root, 'dist', 'somenamespace.js'), '');
      compilerCtx.fs.writeFile(path.join(root, 'dist', 'index.cjs.js'), '');
      buildCtx.packageJson.main = 'dist/somenamespace.js';
      v.validateMain(config, compilerCtx, buildCtx, collectionOutputTarget);
      expect(buildCtx.diagnostics).toHaveLength(1);
    });

    it('validate main', async () => {
      compilerCtx.fs.writeFile(path.join(root, 'dist', 'index.cjs.js'), '');
      buildCtx.packageJson.main = 'dist/index.cjs.js';
      v.validateMain(config, compilerCtx, buildCtx, collectionOutputTarget);
      expect(buildCtx.diagnostics).toHaveLength(0);
    });

    it('missing main', async () => {
      v.validateMain(config, compilerCtx, buildCtx, collectionOutputTarget);
      expect(buildCtx.diagnostics).toHaveLength(1);
    });
  });

  describe('collection', () => {
    it('should produce a warning when missing collection property', async () => {
      v.validateCollection(config, compilerCtx, buildCtx, collectionOutputTarget);

      expect(buildCtx.diagnostics[0].messageText).toMatch(/package.json "collection" property is required/);
      expect(buildCtx.diagnostics[0].level).toBe('warn');
    });

    it('should produce a warning if the supplied path does not match the recommended path', () => {
      buildCtx.packageJson.collection = 'bad/path';

      v.validateCollection(config, compilerCtx, buildCtx, collectionOutputTarget);

      expect(buildCtx.diagnostics[0].messageText).toBe(
        `package.json "collection" property is required when generating a distribution and must be set to: ${normalizePath(
          'dist/collection/collection-manifest.json',
          false,
        )}`,
      );
      expect(buildCtx.diagnostics[0].level).toBe('warn');
    });

    it('should not produce a warning if the normalized paths are the same', () => {
      buildCtx.packageJson.collection = './dist/collection/collection-manifest.json';

      v.validateCollection(config, compilerCtx, buildCtx, collectionOutputTarget);

      expect(buildCtx.diagnostics.length).toEqual(0);
    });
  });
});
