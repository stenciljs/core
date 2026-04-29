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

  describe('explicit input property', () => {
    it('uses explicit input path when provided', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
        input: './src/theme.css',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle?.input).toBe(join(rootDir, 'src/theme.css'));
    });

    it('explicit input takes precedence over globalStyle config', () => {
      config.globalStyle = './src/global.css';
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
        input: './src/theme.css',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      // The explicit input should be used, not globalStyle
      expect(globalStyle?.input).toBe(join(rootDir, 'src/theme.css'));
    });

    it('falls back to globalStyle config when no explicit input', () => {
      config.globalStyle = './src/global.css';
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
        // No explicit input
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      // Should use globalStyle config since no explicit input
      expect(globalStyle?.input).toBe(join(rootDir, 'src/global.css'));
    });

    it('input is undefined when neither explicit input nor globalStyle set', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle?.input).toBeUndefined();
    });

    it('resolves relative input paths from root directory', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
        input: 'styles/main.css',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle?.input).toBe(join(rootDir, 'styles/main.css'));
    });

    it('handles absolute input paths correctly', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
        input: '/absolute/path/to/styles.css',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle?.input).toBe('/absolute/path/to/styles.css');
    });
  });

  describe('fileName derivation', () => {
    it('uses explicit fileName when provided', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
        input: './src/styles.css',
        fileName: 'custom-name.css',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle?.fileName).toBe('custom-name.css');
    });

    it('uses input basename when explicit input provided and no fileName', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
        input: './src/my-theme.css',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle?.fileName).toBe('my-theme.css');
    });

    it('uses {namespace}.css when globalStyle config used (no explicit input)', () => {
      config.globalStyle = './src/global.css';
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
        // No explicit input or fileName
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      // Should use namespace.css for backwards compat, not 'global.css'
      // mockConfig uses 'testing' as fsNamespace
      expect(globalStyle?.fileName).toBe('testing.css');
    });

    it('uses {namespace}.css when no input at all', () => {
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      // mockConfig uses 'testing' as fsNamespace
      expect(globalStyle?.fileName).toBe('testing.css');
    });

    it('uses custom namespace for fileName when globalStyle config used', () => {
      config.namespace = 'MyLib';
      config.globalStyle = './src/global.css';
      const target: d.OutputTargetGlobalStyle = {
        type: GLOBAL_STYLE,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyle = validatedConfig.outputTargets.find(isOutputTargetGlobalStyle);
      expect(globalStyle?.fileName).toBe('mylib.css');
    });
  });

  describe('multiple global-style outputs', () => {
    it('supports multiple global-style outputs with different inputs', () => {
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          input: './src/theme.css',
        },
        {
          type: GLOBAL_STYLE,
          input: './src/utilities.css',
        },
      ];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyles = validatedConfig.outputTargets.filter(isOutputTargetGlobalStyle);
      expect(globalStyles).toHaveLength(2);
      expect(globalStyles[0].input).toBe(join(rootDir, 'src/theme.css'));
      expect(globalStyles[0].fileName).toBe('theme.css');
      expect(globalStyles[1].input).toBe(join(rootDir, 'src/utilities.css'));
      expect(globalStyles[1].fileName).toBe('utilities.css');
    });

    it('supports multiple global-style outputs with custom directories', () => {
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          input: './src/theme.css',
          dir: 'dist/css',
        },
        {
          type: GLOBAL_STYLE,
          input: './src/utilities.css',
          dir: 'dist/other-css',
        },
      ];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyles = validatedConfig.outputTargets.filter(isOutputTargetGlobalStyle);
      expect(globalStyles).toHaveLength(2);
      expect(globalStyles[0].dir).toBe(join(rootDir, 'dist/css'));
      expect(globalStyles[1].dir).toBe(join(rootDir, 'dist/other-css'));
    });

    it('supports mixed explicit input and globalStyle fallback', () => {
      config.globalStyle = './src/global.css';
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          input: './src/theme.css', // explicit input
        },
        {
          type: GLOBAL_STYLE,
          // no input - will use globalStyle
        },
      ];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const globalStyles = validatedConfig.outputTargets.filter(isOutputTargetGlobalStyle);
      expect(globalStyles).toHaveLength(2);
      expect(globalStyles[0].input).toBe(join(rootDir, 'src/theme.css'));
      expect(globalStyles[0].fileName).toBe('theme.css');
      expect(globalStyles[1].input).toBe(join(rootDir, 'src/global.css'));
      expect(globalStyles[1].fileName).toBe('testing.css'); // namespace-based (mockConfig uses 'testing')
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

  describe('diagnostics and warnings', () => {
    it('emits warning when both globalStyle config and explicit input are used', () => {
      config.globalStyle = './src/global.css';
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          input: './src/theme.css', // explicit input conflicts with globalStyle config
        },
      ];

      const { diagnostics } = validateConfig(config, mockLoadConfigInit());

      const warnings = diagnostics.filter((d) => d.level === 'warn');
      expect(warnings.length).toBeGreaterThan(0);

      const globalStyleWarning = warnings.find(
        (w) => w.messageText.includes('globalStyle') && w.messageText.includes('global-style'),
      );
      expect(globalStyleWarning).toBeDefined();
      expect(globalStyleWarning?.messageText).toContain('Choose one approach');
    });

    it('does not emit warning when only globalStyle config is used', () => {
      config.globalStyle = './src/global.css';
      config.outputTargets = [];

      const { diagnostics } = validateConfig(config, mockLoadConfigInit());

      const warnings = diagnostics.filter((d) => d.level === 'warn');
      const globalStyleWarning = warnings.find(
        (w) => w.messageText.includes('globalStyle') && w.messageText.includes('global-style'),
      );
      expect(globalStyleWarning).toBeUndefined();
    });

    it('does not emit warning when only explicit input is used (no globalStyle config)', () => {
      config.globalStyle = undefined;
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          input: './src/theme.css',
        },
      ];

      const { diagnostics } = validateConfig(config, mockLoadConfigInit());

      const warnings = diagnostics.filter((d) => d.level === 'warn');
      const globalStyleWarning = warnings.find(
        (w) => w.messageText.includes('globalStyle') && w.messageText.includes('global-style'),
      );
      expect(globalStyleWarning).toBeUndefined();
    });

    it('does not emit warning when explicit global-style has no input (uses globalStyle fallback)', () => {
      config.globalStyle = './src/global.css';
      config.outputTargets = [
        {
          type: GLOBAL_STYLE,
          // No explicit input - will fallback to globalStyle
        },
      ];

      const { diagnostics } = validateConfig(config, mockLoadConfigInit());

      const warnings = diagnostics.filter((d) => d.level === 'warn');
      const globalStyleWarning = warnings.find(
        (w) => w.messageText.includes('globalStyle') && w.messageText.includes('global-style'),
      );
      expect(globalStyleWarning).toBeUndefined();
    });
  });
});
