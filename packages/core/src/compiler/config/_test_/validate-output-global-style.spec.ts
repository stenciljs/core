import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockConfig, mockLoadConfigInit } from '../../../testing';
import { ASSETS, GLOBAL_STYLE, isOutputTargetGlobalStyle, join, resolve } from '../../../utils';
import { validateConfig } from '../validate-config';

describe('validateGlobalStyleOutputTarget', () => {
  let config: d.Config;

  const rootDir = resolve('/');
  const defaultDir = join(rootDir, 'dist', 'assets');

  beforeEach(() => {
    config = mockConfig();
  });

  describe('defaults', () => {
    it('sets correct default directory', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle).toBeDefined();
      expect(globalStyle?.dir).toBe(defaultDir);
    });

    it('uses custom directory when specified', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
        dir: 'my-styles-output',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle?.dir).toBe(join(rootDir, 'my-styles-output'));
    });

    it('defaults copyToLoaderBrowser to true', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle?.copyToLoaderBrowser).toBe(true);
    });

    it('preserves copyToLoaderBrowser when explicitly set to false', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
        copyToLoaderBrowser: false,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle?.copyToLoaderBrowser).toBe(false);
    });

    it('defaults skipInDev to false', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle?.skipInDev).toBe(false);
    });

    it('preserves skipInDev when explicitly set to true', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
        skipInDev: true,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle?.skipInDev).toBe(true);
    });
  });

  describe('auto-generation', () => {
    it('auto-generates global-style output when globalStyle config is set', () => {
      config.globalStyle = 'src/global.css';
      config.outputTargets = [];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle).toBeDefined();
      expect(globalStyle?.type).toBe(GLOBAL_STYLE);
      expect(globalStyle?.dir).toBe(defaultDir);
      expect(globalStyle?.copyToLoaderBrowser).toBe(true);
    });

    it('does not auto-generate global-style output when globalStyle config is not set', () => {
      config.globalStyle = undefined;
      config.outputTargets = [];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle).toBeUndefined();
    });

    it('does not duplicate global-style if already explicitly configured', () => {
      config.globalStyle = 'src/global.css';
      config.outputTargets = [{ type: GLOBAL_STYLE, dir: 'custom-styles' }];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyleTargets = validatedConfig.outputTargets.filter(isOutputTargetGlobalStyle);
      expect(globalStyleTargets).toHaveLength(1);
      expect(globalStyleTargets[0].dir).toBe(join(rootDir, 'custom-styles'));
    });

    it('auto-generates in both dev and prod mode', () => {
      // Dev mode
      const devConfig = mockConfig({ devMode: true });
      devConfig.globalStyle = 'src/global.css';
      devConfig.outputTargets = [];

      const { config: validatedDevConfig } = validateConfig(devConfig, mockLoadConfigInit());
      expect(validatedDevConfig.outputTargets.find(isOutputTargetGlobalStyle)).toBeDefined();

      // Prod mode
      const prodConfig = mockConfig({ devMode: false });
      prodConfig.globalStyle = 'src/global.css';
      prodConfig.outputTargets = [];

      const { config: validatedProdConfig } = validateConfig(prodConfig, mockLoadConfigInit());
      expect(validatedProdConfig.outputTargets.find(isOutputTargetGlobalStyle)).toBeDefined();
    });
  });

  describe('absolute paths', () => {
    it('handles absolute paths correctly', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
        dir: '/absolute/path/to/styles',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle?.dir).toBe('/absolute/path/to/styles');
    });

    it('resolves relative paths from root directory', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
        dir: 'relative/styles/path',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle?.dir).toBe(join(rootDir, 'relative/styles/path'));
    });
  });

  describe('explicit configuration', () => {
    it('preserves all explicit configuration values', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
        dir: 'custom-dir',
        copyToLoaderBrowser: false,
        skipInDev: true,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle).toBeDefined();
      expect(globalStyle?.dir).toBe(join(rootDir, 'custom-dir'));
      expect(globalStyle?.copyToLoaderBrowser).toBe(false);
      expect(globalStyle?.skipInDev).toBe(true);
    });
  });

  describe('interaction with other output targets', () => {
    it('does not interfere with assets output target', () => {
      config.globalStyle = 'src/global.css';
      config.outputTargets = [];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      // Both should exist
      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      const assets = validatedConfig.outputTargets.find((o) => o.type === ASSETS);

      expect(globalStyle).toBeDefined();
      expect(assets).toBeDefined();
    });

    it('global-style and assets can have the same directory', () => {
      config.globalStyle = 'src/global.css';
      config.outputTargets = [
        { type: GLOBAL_STYLE, dir: 'dist/assets' },
        { type: ASSETS, dir: 'dist/assets' },
      ];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      const assets = validatedConfig.outputTargets.find((o) => o.type === ASSETS);

      expect(globalStyle?.dir).toBe(join(rootDir, 'dist/assets'));
      expect((assets as d.OutputTargetAssets)?.dir).toBe(join(rootDir, 'dist/assets'));
    });
  });
});
