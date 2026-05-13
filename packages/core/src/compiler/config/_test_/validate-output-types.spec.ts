import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockConfig, mockLoadConfigInit } from '../../../testing';
import { isOutputTargetTypes, join, resolve, TYPES } from '../../../utils';
import { validateConfig } from '../validate-config';

describe('validateTypesOutputTarget', () => {
  let config: d.Config;

  const rootDir = resolve('/');
  const defaultDir = join(rootDir, 'dist', 'types');

  beforeEach(() => {
    config = mockConfig();
  });

  describe('defaults', () => {
    it('sets correct default directory', () => {
      const target: d.OutputTargetTypes = {
        type: TYPES,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const types = validatedConfig.outputTargets.find(isOutputTargetTypes);
      expect(types).toBeDefined();
      expect(types?.dir).toBe(defaultDir);
    });

    it('uses custom directory when specified', () => {
      const target: d.OutputTargetTypes = {
        type: TYPES,
        dir: 'my-types-output',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const types = validatedConfig.outputTargets.find(isOutputTargetTypes);
      expect(types?.dir).toBe(join(rootDir, 'my-types-output'));
    });

    it('defaults empty to true', () => {
      const target: d.OutputTargetTypes = {
        type: TYPES,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const types = validatedConfig.outputTargets.find(isOutputTargetTypes);
      expect(types?.empty).toBe(true);
    });

    it('preserves empty when explicitly set to false', () => {
      const target: d.OutputTargetTypes = {
        type: TYPES,
        empty: false,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const types = validatedConfig.outputTargets.find(isOutputTargetTypes);
      expect(types?.empty).toBe(false);
    });

    it('defaults skipInDev to true', () => {
      const target: d.OutputTargetTypes = {
        type: TYPES,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const types = validatedConfig.outputTargets.find(isOutputTargetTypes);
      expect(types?.skipInDev).toBe(true);
    });

    it('preserves skipInDev when explicitly set to false', () => {
      const target: d.OutputTargetTypes = {
        type: TYPES,
        skipInDev: false,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const types = validatedConfig.outputTargets.find(isOutputTargetTypes);
      expect(types?.skipInDev).toBe(false);
    });
  });

  describe('explicit configuration', () => {
    it('auto-generates types in production mode when www is auto-added as default', () => {
      // When no output targets are specified, www is auto-added as the default output target.
      // In production mode, types and collection are auto-generated alongside www.
      config.outputTargets = [];
      (config as d.UnvalidatedConfig).devMode = false;

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      // Types should be auto-generated because www is added as default
      const types = validatedConfig.outputTargets.find(isOutputTargetTypes);
      expect(types).toBeDefined();
      expect(types?.dir).toBe(join(resolve('/'), 'dist', 'types'));
    });

    it('preserves explicit types configuration', () => {
      const target: d.OutputTargetTypes = {
        type: TYPES,
        dir: 'custom-types',
        empty: false,
        skipInDev: false,
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const types = validatedConfig.outputTargets.find(isOutputTargetTypes);
      expect(types).toBeDefined();
      expect(types?.dir).toBe(join(rootDir, 'custom-types'));
      expect(types?.empty).toBe(false);
      expect(types?.skipInDev).toBe(false);
    });
  });

  describe('absolute paths', () => {
    it('handles absolute paths correctly', () => {
      const target: d.OutputTargetTypes = {
        type: TYPES,
        dir: '/absolute/path/to/types',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const types = validatedConfig.outputTargets.find(isOutputTargetTypes);
      expect(types?.dir).toBe('/absolute/path/to/types');
    });

    it('resolves relative paths from root directory', () => {
      const target: d.OutputTargetTypes = {
        type: TYPES,
        dir: 'relative/types/path',
      };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const types = validatedConfig.outputTargets.find(isOutputTargetTypes);
      expect(types?.dir).toBe(join(rootDir, 'relative/types/path'));
    });
  });
});
