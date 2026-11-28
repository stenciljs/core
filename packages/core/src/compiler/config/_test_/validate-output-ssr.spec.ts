import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockConfig, mockLoadConfigInit } from '../../../testing';
import { isOutputTargetSsr, join, resolve, SSR, WWW } from '../../../utils';
import { validateConfig } from '../validate-config';

describe('validateSsrOutputTarget', () => {
  let config: d.Config;

  const rootDir = resolve('/');
  const defaultDir = join(rootDir, 'dist', 'ssr');

  beforeEach(() => {
    config = mockConfig();
  });

  describe('defaults', () => {
    it('sets correct default directory', () => {
      const target: d.OutputTargetSsr = {
        type: SSR,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr).toBeDefined();
      expect(ssr?.dir).toBe(defaultDir);
    });

    it('uses custom directory when specified', () => {
      const target: d.OutputTargetSsr = {
        type: SSR,
        dir: 'my-ssr-output',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr?.dir).toBe(join(rootDir, 'my-ssr-output'));
    });

    it('defaults empty to true', () => {
      const target: d.OutputTargetSsr = {
        type: SSR,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr?.empty).toBe(true);
    });

    it('preserves empty when explicitly set to false', () => {
      const target: d.OutputTargetSsr = {
        type: SSR,
        empty: false,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr?.empty).toBe(false);
    });

    it('defaults minify to false', () => {
      const target: d.OutputTargetSsr = {
        type: SSR,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr?.minify).toBe(false);
    });

    it('preserves minify when explicitly set to true', () => {
      const target: d.OutputTargetSsr = {
        type: SSR,
        minify: true,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr?.minify).toBe(true);
    });

    it('defaults cjs to false', () => {
      const target: d.OutputTargetSsr = {
        type: SSR,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr?.cjs).toBe(false);
    });

    it('preserves cjs when explicitly set to true', () => {
      const target: d.OutputTargetSsr = {
        type: SSR,
        cjs: true,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr?.cjs).toBe(true);
    });

    it('adds Node.js built-ins to external array', () => {
      const target: d.OutputTargetSsr = {
        type: SSR,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr?.external).toContain('fs');
      expect(ssr?.external).toContain('path');
      expect(ssr?.external).toContain('crypto');
    });

    it('preserves custom externals and adds Node.js built-ins', () => {
      const target: d.OutputTargetSsr = {
        type: SSR,
        external: ['my-custom-external'],
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr?.external).toContain('my-custom-external');
      expect(ssr?.external).toContain('fs');
      expect(ssr?.external).toContain('path');
      expect(ssr?.external).toContain('crypto');
    });
  });

  describe('skipInDev', () => {
    it('defaults skipInDev to true when devServer.ssr is not enabled', () => {
      const target: d.OutputTargetSsr = {
        type: SSR,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr?.skipInDev).toBe(true);
    });

    it('defaults skipInDev to false when devServer.ssr is enabled', () => {
      const target: d.OutputTargetSsr = {
        type: SSR,
      };
      config.outputTargets = [target];
      config.devServer = { ssr: true };

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr?.skipInDev).toBe(false);
    });

    it('preserves skipInDev when explicitly set to false', () => {
      const target: d.OutputTargetSsr = {
        type: SSR,
        skipInDev: false,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr?.skipInDev).toBe(false);
    });

    it('preserves skipInDev when explicitly set to true even with devServer.ssr', () => {
      const target: d.OutputTargetSsr = {
        type: SSR,
        skipInDev: true,
      };
      config.outputTargets = [target];
      config.devServer = { ssr: true };

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr?.skipInDev).toBe(true);
    });
  });

  describe('auto-creation', () => {
    it('auto-creates SSR output target when prerender is enabled with www output', () => {
      const wwwTarget: d.OutputTargetWww = {
        type: WWW,
        indexHtml: 'index.html',
      };
      config.outputTargets = [wwwTarget];
      config.prerender = true;

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr).toBeDefined();
      expect(ssr?.type).toBe(SSR);
    });

    it('auto-creates SSR output target when ssr config is enabled with www output', () => {
      const wwwTarget: d.OutputTargetWww = {
        type: WWW,
        indexHtml: 'index.html',
      };
      config.outputTargets = [wwwTarget];
      config.ssr = true;

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr).toBeDefined();
      expect(ssr?.type).toBe(SSR);
    });

    it('auto-creates SSR output target when www output has no explicit indexHtml (defaults to index.html)', () => {
      // Note: The www validator sets a default indexHtml of 'index.html' when not provided,
      // so SSR will still be auto-created
      const wwwTarget: d.OutputTargetWww = {
        type: WWW,
      };
      config.outputTargets = [wwwTarget];
      config.prerender = true;

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr).toBeDefined();
      expect(ssr?.type).toBe(SSR);
    });

    it('does not auto-create SSR output target when prerender is false', () => {
      const wwwTarget: d.OutputTargetWww = {
        type: WWW,
        indexHtml: 'index.html',
      };
      config.outputTargets = [wwwTarget];
      config.prerender = false;

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssr = validatedConfig.outputTargets.find(isOutputTargetSsr);
      expect(ssr).toBeUndefined();
    });

    it('does not duplicate SSR output target if already explicitly configured', () => {
      const wwwTarget: d.OutputTargetWww = {
        type: WWW,
        indexHtml: 'index.html',
      };
      const ssrTarget: d.OutputTargetSsr = {
        type: SSR,
        dir: 'my-custom-ssr',
      };
      config.outputTargets = [wwwTarget, ssrTarget];
      config.prerender = true;

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssrTargets = validatedConfig.outputTargets.filter(isOutputTargetSsr);
      expect(ssrTargets).toHaveLength(1);
      expect(ssrTargets[0].dir).toBe(join(rootDir, 'my-custom-ssr'));
    });
  });
});
