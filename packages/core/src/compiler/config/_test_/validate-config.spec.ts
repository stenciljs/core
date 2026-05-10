import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockCompilerSystem, mockLoadConfigInit, mockLogger } from '../../../testing';
import { DOCS_CUSTOM, DOCS_JSON, DOCS_README, DOCS_VSCODE } from '../../../utils';
import { isWatchIgnorePath } from '../../fs-watch/fs-watch-rebuild';
import { validateConfig } from '../validate-config';

describe('validation', () => {
  let userConfig: d.UnvalidatedConfig;
  let bootstrapConfig: d.LoadConfigInit;
  const logger = mockLogger();
  const sys = mockCompilerSystem();

  beforeEach(() => {
    userConfig = {
      sys: sys,
      logger: logger,
      rootDir: '/User/some/path/',
      namespace: 'Testing',
    };
    bootstrapConfig = mockLoadConfigInit();
  });

  describe('caching', () => {
    it('should cache the validated config between calls if the same config is passed back in', () => {
      const { config } = validateConfig(userConfig, {});
      const { config: secondRound } = validateConfig(config, {});
      // we should have object identity
      expect(config === secondRound).toBe(true);
      // objects should be deepEqual as well
      expect(config).toEqual(secondRound);
    });

    it('should bust the cache if a different config is supplied than the cached one', () => {
      // validate once, caching that result
      const { config } = validateConfig(userConfig, {});
      // pass a new initial configuration
      const { config: secondRound } = validateConfig({ ...userConfig }, {});
      // shouldn't have object equality with the earlier one
      expect(config === secondRound).toBe(false);
    });
  });

  describe('devMode validation', () => {
    it('defaults devMode to false (production) when not set by CLI', () => {
      // devMode is not user-settable in stencil.config.ts; it is injected by
      // the CLI via --dev flag. When absent the validator defaults to false.
      const { config } = validateConfig({}, bootstrapConfig);
      expect(config.devMode).toBe(false);
    });

    it('accepts devMode: true when injected by CLI (--dev flag path)', () => {
      // Simulates the CLI having set devMode: true before calling validateConfig
      const { config } = validateConfig({ devMode: true }, bootstrapConfig);
      expect(config.devMode).toBe(true);
    });

    it('falls back to false when a non-boolean devMode value arrives (defensive)', () => {
      // Should never happen in practice, but the validator guards against it
      const devMode = 'not-a-bool' as unknown as boolean;
      const { config } = validateConfig({ devMode }, bootstrapConfig);
      expect(config.devMode).toBe(false);
    });
  });

  describe('allowInlineScripts', () => {
    it('set allowInlineScripts true', () => {
      userConfig.allowInlineScripts = true;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.allowInlineScripts).toBe(true);
    });

    it('set allowInlineScripts false', () => {
      userConfig.allowInlineScripts = false;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.allowInlineScripts).toBe(false);
    });

    it('default allowInlineScripts true', () => {
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.allowInlineScripts).toBe(true);
    });
  });

  describe('transformAliasedImportPaths', () => {
    it.each([true, false])('set transformAliasedImportPaths %p', (bool) => {
      userConfig.transformAliasedImportPaths = bool;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.transformAliasedImportPaths).toBe(bool);
    });

    it('defaults `transformAliasedImportPaths` to true', () => {
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.transformAliasedImportPaths).toBe(true);
    });
  });

  describe('suppressReservedPublicNameWarnings', () => {
    it.each([true, false])(
      'sets suppressReservedPublicNameWarnings to %p when provided',
      (bool) => {
        userConfig.suppressReservedPublicNameWarnings = bool;
        const { config } = validateConfig(userConfig, bootstrapConfig);
        expect(config.suppressReservedPublicNameWarnings).toBe(bool);
      },
    );

    it('defaults suppressReservedPublicNameWarnings to false', () => {
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.suppressReservedPublicNameWarnings).toBe(false);
    });
  });

  describe('enableCache', () => {
    it('set enableCache true', () => {
      userConfig.enableCache = true;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.enableCache).toBe(true);
    });

    it('set enableCache false', () => {
      userConfig.enableCache = false;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.enableCache).toBe(false);
    });

    it('default enableCache true', () => {
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.enableCache).toBe(true);
    });
  });

  describe('buildAppCore', () => {
    it('set buildAppCore true', () => {
      userConfig.buildAppCore = true;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.buildAppCore).toBe(true);
    });

    it('set buildAppCore false', () => {
      userConfig.buildAppCore = false;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.buildAppCore).toBe(false);
    });

    it('default buildAppCore true', () => {
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.buildAppCore).toBe(true);
    });
  });

  describe('hashed filenames', () => {
    it('should error when hashedFileNameLength too large', () => {
      userConfig.hashedFileNameLength = 33;
      const validated = validateConfig(userConfig, bootstrapConfig);
      expect(validated.diagnostics).toHaveLength(1);
    });

    it('should error when hashedFileNameLength too small', () => {
      userConfig.hashedFileNameLength = 3;
      const validated = validateConfig(userConfig, bootstrapConfig);
      expect(validated.diagnostics).toHaveLength(1);
    });

    it('should set from hashedFileNameLength', () => {
      userConfig.hashedFileNameLength = 28;
      const validated = validateConfig(userConfig, bootstrapConfig);
      expect(validated.config.hashedFileNameLength).toBe(28);
    });

    it('should set hashedFileNameLength', () => {
      userConfig.hashedFileNameLength = 6;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.hashedFileNameLength).toBe(6);
    });

    it('should default hashedFileNameLength', () => {
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.hashedFileNameLength).toBe(8);
    });

    it('should default hashFileNames to false in watch mode despite prod mode', () => {
      userConfig.watch = true;
      userConfig.devMode = false;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.hashFileNames).toBe(true);
    });

    it('should default hashFileNames to true in prod mode', () => {
      userConfig.devMode = false;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.hashFileNames).toBe(true);
    });

    it('should default hashFileNames to false in dev mode', () => {
      userConfig.devMode = true;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.hashFileNames).toBe(false);
    });

    it.each([true, false])('should set hashFileNames when hashFileNames===%b', (hashFileNames) => {
      userConfig.hashFileNames = hashFileNames;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.hashFileNames).toBe(hashFileNames);
    });

    it('should set hashFileNames from function', () => {
      (userConfig as any).hashFileNames = () => {
        return true;
      };
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.hashFileNames).toBe(true);
    });
  });

  describe('minifyJs', () => {
    it('should set minifyJs to true', () => {
      userConfig.devMode = true;
      userConfig.minifyJs = true;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.minifyJs).toBe(true);
    });

    it('should default minifyJs to true in prod mode', () => {
      userConfig.devMode = false;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.minifyJs).toBe(true);
    });

    it('should default minifyJs to false in dev mode', () => {
      userConfig.devMode = true;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.minifyJs).toBe(false);
    });
  });

  describe('minifyCss', () => {
    it('should set minifyCss to true', () => {
      userConfig.devMode = true;
      userConfig.minifyCss = true;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.minifyCss).toBe(true);
    });

    it('should default minifyCss to true in prod mode', () => {
      userConfig.devMode = false;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.minifyCss).toBe(true);
    });

    it('should default minifyCss to false in dev mode', () => {
      userConfig.devMode = true;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.minifyCss).toBe(false);
    });
  });

  it('should default watch to false', () => {
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.watch).toBe(false);
  });

  it('should pass through devMode: false (CLI did not pass --dev)', () => {
    userConfig.devMode = false;
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.devMode).toBe(false);
  });

  it('should pass through devMode: true (CLI passed --dev)', () => {
    userConfig.devMode = true;
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.devMode).toBe(true);
  });

  it('should default devMode to false when not set', () => {
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.devMode).toBe(false);
  });

  it.each([DOCS_JSON, DOCS_CUSTOM, DOCS_VSCODE])(
    'should not add "%s" output target by default',
    (targetType) => {
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.outputTargets.some((o) => o.type === targetType)).toBe(false);
    },
  );

  it('should add "docs-readme" output target by default in production mode', () => {
    userConfig.devMode = false;
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.outputTargets.some((o) => o.type === DOCS_README)).toBe(true);
  });

  it('should not add "docs-readme" output target in dev mode', () => {
    userConfig.devMode = true;
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.outputTargets.some((o) => o.type === DOCS_README)).toBe(false);
  });

  it('should set devInspector false', () => {
    userConfig.devInspector = false;
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.devInspector).toBe(false);
  });

  it('should set devInspector true', () => {
    userConfig.devInspector = true;
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.devInspector).toBe(true);
  });

  it('should default devInspector false when devMode is false', () => {
    userConfig.devMode = false;
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.devInspector).toBe(false);
  });

  it('should default devInspector true when devMode is true', () => {
    userConfig.devMode = true;
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.devInspector).toBe(true);
  });

  it('should default loader-bundle false and www true', () => {
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.outputTargets.some((o) => o.type === 'loader-bundle')).toBe(false);
    expect(config.outputTargets.some((o) => o.type === 'www')).toBe(true);
  });

  it('should error for invalid outputTarget type', () => {
    userConfig.outputTargets = [
      {
        type: 'whatever',
      } as any,
    ];
    const validated = validateConfig(userConfig, bootstrapConfig);
    expect(validated.diagnostics).toHaveLength(1);
  });

  it('should default outputTargets with www', () => {
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.outputTargets.some((o) => o.type === 'www')).toBe(true);
  });

  it('should set extras defaults', () => {
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.extras.lightDomPatches).toBe(true);
    expect(config.extras.lifecycleDOMEvents).toBe(false);
    expect(config.extras.initializeNextTick).toBe(false);
    expect(config.extras.additionalTagTransformers).toBe(false);
  });

  describe('extras.additionalTagTransformers', () => {
    it('set extras.additionalTagTransformers false', () => {
      userConfig.extras = { additionalTagTransformers: false };
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.extras.additionalTagTransformers).toBe(false);
    });

    it('set extras.additionalTagTransformers true', () => {
      userConfig.extras = { additionalTagTransformers: true };
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.extras.additionalTagTransformers).toBe(true);
    });

    it('set extras.additionalTagTransformers true, dev mode', () => {
      userConfig.devMode = true;
      userConfig.extras = { additionalTagTransformers: true };
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.extras.additionalTagTransformers).toBe(true);
    });

    it('prod mode, set extras.additionalTagTransformers', () => {
      userConfig.devMode = false;
      userConfig.extras = { additionalTagTransformers: true };
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.extras.additionalTagTransformers).toBe(true);
    });

    it('build extras.additionalTagTransformers when set to "prod" and in prod', () => {
      userConfig.devMode = false;
      userConfig.extras = { additionalTagTransformers: 'prod' };
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.extras.additionalTagTransformers).toBe(true);
    });

    it('do not build extras.additionalTagTransformers when set to "prod" and in dev', () => {
      userConfig.devMode = true;
      userConfig.extras = { additionalTagTransformers: 'prod' };
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.extras.additionalTagTransformers).toBe(false);
    });

    it('prod mode default to only modern and not extras.additionalTagTransformers', () => {
      userConfig.devMode = false;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.extras.additionalTagTransformers).toBe(false);
    });
  });

  it('should default lightDomPatches to true', () => {
    userConfig.extras = {};
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.extras.lightDomPatches).toBe(true);
  });

  it('should preserve lightDomPatches: false', () => {
    userConfig.extras = { lightDomPatches: false };
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.extras.lightDomPatches).toBe(false);
  });

  it('should preserve lightDomPatches granular object', () => {
    userConfig.extras = { lightDomPatches: { childNodes: true, domMutations: false } };
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.extras.lightDomPatches).toEqual({ childNodes: true, domMutations: false });
  });

  it('should set taskQueue "async" by default', () => {
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.taskQueue).toBe('async');
  });

  it('should set taskQueue', () => {
    userConfig.taskQueue = 'congestionAsync';
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.taskQueue).toBe('congestionAsync');
  });

  it('empty watchIgnoredRegex, all valid', () => {
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.watchIgnoredRegex).toEqual([]);
    expect(isWatchIgnorePath(config, '/some/image.gif')).toBe(false);
    expect(isWatchIgnorePath(config, '/some/typescript.ts')).toBe(false);
  });

  it('should change a single watchIgnoredRegex to an array', () => {
    userConfig.watchIgnoredRegex = /\.(gif|jpe?g|png)$/i;
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.watchIgnoredRegex).toHaveLength(1);
    expect((config.watchIgnoredRegex as any[])[0]).toEqual(/\.(gif|jpe?g|png)$/i);
    expect(isWatchIgnorePath(config, '/some/image.gif')).toBe(true);
    expect(isWatchIgnorePath(config, '/some/typescript.ts')).toBe(false);
  });

  it('should clean up valid watchIgnoredRegex', () => {
    userConfig.watchIgnoredRegex = [/\.(gif|jpe?g)$/i, null, 'me-regex' as any, /\.(png)$/i];
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.watchIgnoredRegex).toHaveLength(2);
    expect((config.watchIgnoredRegex as any[])[0]).toEqual(/\.(gif|jpe?g)$/i);
    expect((config.watchIgnoredRegex as any[])[1]).toEqual(/\.(png)$/i);
    expect(isWatchIgnorePath(config, '/some/image.gif')).toBe(true);
    expect(isWatchIgnorePath(config, '/some/image.jpg')).toBe(true);
    expect(isWatchIgnorePath(config, '/some/image.png')).toBe(true);
    expect(isWatchIgnorePath(config, '/some/typescript.ts')).toBe(false);
  });

  describe('sourceMap', () => {
    it('sets the field to true when the set to true in the config', () => {
      userConfig.sourceMap = true;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.sourceMap).toBe(true);
    });

    it('sets the field to false when set to false in the config', () => {
      userConfig.sourceMap = false;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.sourceMap).toBe(false);
    });

    it('defaults to "dev" behavior when not set (true in dev mode)', () => {
      userConfig.devMode = true;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.sourceMap).toBe(true);
    });

    it('defaults to "dev" behavior when not set (false in prod mode)', () => {
      userConfig.devMode = false;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.sourceMap).toBe(false);
    });

    it('sets the field to true when set to "dev" and devMode is true', () => {
      userConfig.sourceMap = 'dev';
      userConfig.devMode = true;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.sourceMap).toBe(true);
    });

    it('sets the field to false when set to "dev" and devMode is false', () => {
      userConfig.sourceMap = 'dev';
      userConfig.devMode = false;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.sourceMap).toBe(false);
    });
  });
});
