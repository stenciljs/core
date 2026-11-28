import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockConfig, mockLoadConfigInit } from '../../../testing';
import { ASSETS, GLOBAL_STYLE, isOutputTargetAssets, join, resolve } from '../../../utils';
import { validateConfig } from '../validate-config';

describe('validateAssetsOutputTarget', () => {
  let config: d.Config;

  const rootDir = resolve('/');
  const defaultDir = join(rootDir, 'dist', 'assets');

  beforeEach(() => {
    config = mockConfig();
  });

  describe('defaults', () => {
    it('sets correct default directory', () => {
      const target: d.OutputTargetAssets = {
        type: ASSETS,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const assets = validatedConfig.outputTargets.find(isOutputTargetAssets);
      expect(assets).toBeDefined();
      expect(assets?.dir).toBe(defaultDir);
    });

    it('uses custom directory when specified', () => {
      const target: d.OutputTargetAssets = {
        type: ASSETS,
        dir: 'my-assets-output',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const assets = validatedConfig.outputTargets.find(isOutputTargetAssets);
      expect(assets?.dir).toBe(join(rootDir, 'my-assets-output'));
    });

    it('defaults skipInDev to false', () => {
      const target: d.OutputTargetAssets = {
        type: ASSETS,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const assets = validatedConfig.outputTargets.find(isOutputTargetAssets);
      expect(assets?.skipInDev).toBe(false);
    });

    it('preserves skipInDev when explicitly set to true', () => {
      const target: d.OutputTargetAssets = {
        type: ASSETS,
        skipInDev: true,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const assets = validatedConfig.outputTargets.find(isOutputTargetAssets);
      expect(assets?.skipInDev).toBe(true);
    });
  });

  describe('auto-generation', () => {
    it('auto-generates assets output even when no output targets are configured', () => {
      config.outputTargets = [];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const assets = validatedConfig.outputTargets.find(isOutputTargetAssets);
      expect(assets).toBeDefined();
      expect(assets?.type).toBe(ASSETS);
      expect(assets?.dir).toBe(defaultDir);
    });

    it('does not duplicate assets if already explicitly configured', () => {
      config.outputTargets = [{ type: ASSETS, dir: 'custom-assets' }];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const assetsTargets = validatedConfig.outputTargets.filter(isOutputTargetAssets);
      expect(assetsTargets).toHaveLength(1);
      expect(assetsTargets[0].dir).toBe(join(rootDir, 'custom-assets'));
    });

    it('auto-generates in both dev and prod mode', () => {
      // Dev mode
      const devConfig = mockConfig({ devMode: true });
      devConfig.outputTargets = [];

      const { config: validatedDevConfig } = validateConfig(devConfig, mockLoadConfigInit());
      expect(validatedDevConfig.outputTargets.find(isOutputTargetAssets)).toBeDefined();

      // Prod mode
      const prodConfig = mockConfig({ devMode: false });
      prodConfig.outputTargets = [];

      const { config: validatedProdConfig } = validateConfig(prodConfig, mockLoadConfigInit());
      expect(validatedProdConfig.outputTargets.find(isOutputTargetAssets)).toBeDefined();
    });
  });

  describe('absolute paths', () => {
    it('handles absolute paths correctly', () => {
      const target: d.OutputTargetAssets = {
        type: ASSETS,
        dir: '/absolute/path/to/assets',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const assets = validatedConfig.outputTargets.find(isOutputTargetAssets);
      expect(assets?.dir).toBe('/absolute/path/to/assets');
    });

    it('resolves relative paths from root directory', () => {
      const target: d.OutputTargetAssets = {
        type: ASSETS,
        dir: 'relative/assets/path',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const assets = validatedConfig.outputTargets.find(isOutputTargetAssets);
      expect(assets?.dir).toBe(join(rootDir, 'relative/assets/path'));
    });
  });

  describe('explicit configuration', () => {
    it('preserves all explicit configuration values', () => {
      const target: d.OutputTargetAssets = {
        type: ASSETS,
        dir: 'custom-dir',
        skipInDev: true,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const assets = validatedConfig.outputTargets.find(isOutputTargetAssets);
      expect(assets).toBeDefined();
      expect(assets?.dir).toBe(join(rootDir, 'custom-dir'));
      expect(assets?.skipInDev).toBe(true);
    });
  });

  describe('interaction with other output targets', () => {
    it('does not interfere with global-style output target', () => {
      config.globalStyle = 'src/global.css';
      config.outputTargets = [];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      // Both should exist
      const assets = validatedConfig.outputTargets.find(isOutputTargetAssets);
      const globalStyle = validatedConfig.outputTargets.find((o) => o.type === GLOBAL_STYLE);

      expect(assets).toBeDefined();
      expect(globalStyle).toBeDefined();
    });

    it('assets and global-style share the same default directory', () => {
      config.globalStyle = 'src/global.css';
      config.outputTargets = [];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const assets = validatedConfig.outputTargets.find(isOutputTargetAssets);
      const globalStyle = validatedConfig.outputTargets.find(
        (o) => o.type === GLOBAL_STYLE,
      ) as d.OutputTargetGlobalStyle;

      expect(assets?.dir).toBe(defaultDir);
      expect(globalStyle?.dir).toBe(defaultDir);
    });
  });

  describe('multiple assets targets', () => {
    it('allows multiple assets output targets with different directories', () => {
      config.outputTargets = [
        { type: ASSETS, dir: 'dist/assets1' },
        { type: ASSETS, dir: 'dist/assets2' },
      ];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const assetsTargets = validatedConfig.outputTargets.filter(isOutputTargetAssets);
      expect(assetsTargets).toHaveLength(2);
      expect(assetsTargets[0].dir).toBe(join(rootDir, 'dist/assets1'));
      expect(assetsTargets[1].dir).toBe(join(rootDir, 'dist/assets2'));
    });
  });
});
