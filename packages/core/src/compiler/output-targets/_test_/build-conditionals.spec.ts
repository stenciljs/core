import { mockConfig, mockLoadConfigInit } from '@stencil/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import type * as d from '@stencil/core';

import { validateConfig } from '../../config/validate-config';
import { getLazyBuildConditionals } from '../dist-lazy/lazy-build-conditionals';
import { getHydrateBuildConditionals } from '../ssr/hydrate-build-conditionals';
import { getStandaloneBuildConditionals } from '../standalone/standalone-build-conditionals';

describe('build-conditionals', () => {
  let userConfig: d.Config;
  let cmps: d.ComponentCompilerMeta[];

  beforeEach(() => {
    userConfig = mockConfig();
    cmps = [];
  });

  describe('getStandaloneBuildConditionals', () => {
    it('default', () => {
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getStandaloneBuildConditionals(config, cmps);
      expect(bc).toMatchObject({
        lazyLoad: false,
        hydrateClientSide: false,
        hydrateServerSide: false,
      });
    });

    it('taskQueue async', () => {
      userConfig.taskQueue = 'async';
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getStandaloneBuildConditionals(config, cmps);
      expect(bc.asyncQueue).toBe(false);
      expect(bc.taskQueue).toBe(true);
      expect(config.taskQueue).toBe('async');
    });

    it('taskQueue immediate', () => {
      userConfig.taskQueue = 'immediate';
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getStandaloneBuildConditionals(config, cmps);
      expect(bc.asyncQueue).toBe(false);
      expect(bc.taskQueue).toBe(false);
      expect(config.taskQueue).toBe('immediate');
    });

    it('taskQueue congestionAsync', () => {
      userConfig.taskQueue = 'congestionAsync';
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getStandaloneBuildConditionals(config, cmps);
      expect(bc.asyncQueue).toBe(true);
      expect(bc.taskQueue).toBe(true);
      expect(config.taskQueue).toBe('congestionAsync');
    });

    it('taskQueue defaults', () => {
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getStandaloneBuildConditionals(config, cmps);
      expect(bc.asyncQueue).toBe(false);
      expect(bc.taskQueue).toBe(true);
      expect(config.taskQueue).toBe('async');
    });

    it('hydrateClientSide true', () => {
      const hydrateOutputTarget: d.OutputTargetSsr = {
        type: 'ssr',
      };
      userConfig.outputTargets = [hydrateOutputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getStandaloneBuildConditionals(config, cmps);
      expect(bc.hydrateClientSide).toBe(true);
    });

    it('hydratedSelectorName', () => {
      userConfig.hydratedFlag = {
        name: 'boooop',
      };
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getStandaloneBuildConditionals(config, cmps);
      expect(bc.hydratedSelectorName).toBe('boooop');
    });
  });

  describe('getLazyBuildConditionals', () => {
    it('default', () => {
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getLazyBuildConditionals(config, cmps);
      expect(bc).toMatchObject({
        lazyLoad: true,
        hydrateServerSide: false,
      });
    });

    it('taskQueue async', () => {
      userConfig.taskQueue = 'async';
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getLazyBuildConditionals(config, cmps);
      expect(bc.asyncQueue).toBe(false);
      expect(bc.taskQueue).toBe(true);
      expect(config.taskQueue).toBe('async');
    });

    it('taskQueue immediate', () => {
      userConfig.taskQueue = 'immediate';
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getLazyBuildConditionals(config, cmps);
      expect(bc.asyncQueue).toBe(false);
      expect(bc.taskQueue).toBe(false);
      expect(config.taskQueue).toBe('immediate');
    });

    it('taskQueue congestionAsync', () => {
      userConfig.taskQueue = 'congestionAsync';
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getLazyBuildConditionals(config, cmps);
      expect(bc.asyncQueue).toBe(true);
      expect(bc.taskQueue).toBe(true);
      expect(config.taskQueue).toBe('congestionAsync');
    });

    it('taskQueue defaults', () => {
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getLazyBuildConditionals(config, cmps);
      expect(bc.asyncQueue).toBe(false);
      expect(bc.taskQueue).toBe(true);
      expect(config.taskQueue).toBe('async');
    });

    it('hydrateClientSide default', () => {
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getLazyBuildConditionals(config, cmps);
      expect(bc.hydrateClientSide).toBe(false);
    });

    it('hydrateClientSide true', () => {
      const hydrateOutputTarget: d.OutputTargetSsr = {
        type: 'ssr',
      };
      userConfig.outputTargets = [hydrateOutputTarget];
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getLazyBuildConditionals(config, cmps);
      expect(bc.hydrateClientSide).toBe(true);
    });

    it('hydratedSelectorName', () => {
      userConfig.hydratedFlag = {
        name: 'boooop',
      };
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getLazyBuildConditionals(config, cmps);
      expect(bc.hydratedSelectorName).toBe('boooop');
    });
  });

  describe('getHydrateBuildConditionals', () => {
    it('hydratedSelectorName', () => {
      userConfig.hydratedFlag = {
        name: 'boooop',
      };
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getHydrateBuildConditionals(config, cmps);
      expect(bc.hydratedSelectorName).toBe('boooop');
    });

    it('should allow setting to use a class for hydration', () => {
      userConfig.hydratedFlag = {
        selector: 'class',
      };
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getHydrateBuildConditionals(config, cmps);
      expect(bc.hydratedClass).toBe(true);
      expect(bc.hydratedAttribute).toBe(false);
    });

    it('should allow setting to use an attr for hydration', () => {
      userConfig.hydratedFlag = {
        selector: 'attribute',
      };
      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      const bc = getHydrateBuildConditionals(config, cmps);
      expect(bc.hydratedClass).toBe(false);
      expect(bc.hydratedAttribute).toBe(true);
    });
  });
});
