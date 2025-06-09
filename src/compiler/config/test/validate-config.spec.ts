import type * as d from '@stencil/core/declarations';
import { mockCompilerSystem, mockLoadConfigInit, mockLogger } from '@stencil/core/testing';
import { DOCS_CUSTOM, DOCS_JSON, DOCS_README, DOCS_VSCODE } from '@utils';

import { createConfigFlags } from '../../../cli/config-flags';
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

  describe('flags', () => {
    it('adds a default "flags" object if none is provided', () => {
      userConfig.flags = undefined;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.flags).toEqual({});
    });

    it('serializes a provided "flags" object', () => {
      userConfig.flags = createConfigFlags({ dev: false });
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.flags).toEqual(createConfigFlags({ dev: false }));
    });

    describe('devMode', () => {
      it('defaults "devMode" to false when "flag.prod" is truthy', () => {
        userConfig.flags = createConfigFlags({ prod: true });
        const { config } = validateConfig(userConfig, bootstrapConfig);
        expect(config.devMode).toBe(false);
      });

      it('defaults "devMode" to true when "flag.dev" is truthy', () => {
        userConfig.flags = createConfigFlags({ dev: true });
        const { config } = validateConfig(userConfig, bootstrapConfig);
        expect(config.devMode).toBe(true);
      });

      it('defaults "devMode" to false when "flag.prod" & "flag.dev" are truthy', () => {
        userConfig.flags = createConfigFlags({ dev: true, prod: true });
        const { config } = validateConfig(userConfig, bootstrapConfig);
        expect(config.devMode).toBe(false);
      });

      it('sets "devMode" to false if the user provided flag isn\'t a boolean', () => {
        // the branch under test explicitly requires a value whose type is not allowed by the type system
        const devMode = 'not-a-bool' as unknown as boolean;
        userConfig = { devMode };
        const { config } = validateConfig(userConfig, bootstrapConfig);
        expect(config.devMode).toBe(false);
      });
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

  describe('es5 build', () => {
    it('set buildEs5 false', () => {
      userConfig.buildEs5 = false;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.buildEs5).toBe(false);
    });

    it('set buildEs5 true', () => {
      userConfig.buildEs5 = true;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.buildEs5).toBe(true);
    });

    it('set buildEs5 true, dev mode', () => {
      userConfig.devMode = true;
      userConfig.buildEs5 = true;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.buildEs5).toBe(true);
    });

    it('prod mode, set modern and es5', () => {
      userConfig.devMode = false;
      userConfig.buildEs5 = true;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.buildEs5).toBe(true);
    });

    it('build es5 when set to "prod" and in prod', () => {
      userConfig.devMode = false;
      userConfig.buildEs5 = 'prod';
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.buildEs5).toBe(true);
    });

    it('do not build es5 when set to "prod" and in dev', () => {
      userConfig.devMode = true;
      userConfig.buildEs5 = 'prod';
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.buildEs5).toBe(false);
    });

    it('prod mode default to only modern and not es5', () => {
      userConfig.devMode = false;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.buildEs5).toBe(false);
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

  it('should set devMode to false', () => {
    userConfig.devMode = false;
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.devMode).toBe(false);
  });

  it('should set devMode to true', () => {
    userConfig.devMode = true;
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.devMode).toBe(true);
  });

  it('should default devMode to false', () => {
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.devMode).toBe(false);
  });

  it.each([DOCS_JSON, DOCS_CUSTOM, DOCS_README, DOCS_VSCODE])(
    'should not add "%s" output target by default',
    (targetType) => {
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.outputTargets.some((o) => o.type === targetType)).toBe(false);
    },
  );

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

  it('should default dist false and www true', () => {
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.outputTargets.some((o) => o.type === 'dist')).toBe(false);
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
    expect(config.extras.appendChildSlotFix).toBe(false);
    expect(config.extras.cloneNodeFix).toBe(false);
    expect(config.extras.lifecycleDOMEvents).toBe(false);
    expect(config.extras.scriptDataOpts).toBe(false);
    expect(config.extras.slotChildNodesFix).toBe(false);
    expect(config.extras.initializeNextTick).toBe(false);
    expect(config.extras.tagNameTransform).toBe(false);
    expect(config.extras.scopedSlotTextContentFix).toBe(false);
  });

  it('should set slot config based on `experimentalSlotFixes`', () => {
    userConfig.extras = {};
    userConfig.extras.experimentalSlotFixes = true;
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.extras.appendChildSlotFix).toBe(true);
    expect(config.extras.cloneNodeFix).toBe(true);
    expect(config.extras.slotChildNodesFix).toBe(true);
    expect(config.extras.scopedSlotTextContentFix).toBe(true);
  });

  it('should override slot fix config based on `experimentalSlotFixes`', () => {
    // This test is to verify the flags get overwritten correctly even if an
    // invalid config is ingested. Hence, the `any` cast
    userConfig.extras = {
      appendChildSlotFix: false,
      slotChildNodesFix: false,
      cloneNodeFix: false,
      scopedSlotTextContentFix: false,
      experimentalSlotFixes: true,
    } as any;
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.extras.appendChildSlotFix).toBe(true);
    expect(config.extras.cloneNodeFix).toBe(true);
    expect(config.extras.slotChildNodesFix).toBe(true);
    expect(config.extras.scopedSlotTextContentFix).toBe(true);
  });

  it('should set extras experimentalScopedSlotChanges `true` if set in user config', () => {
    userConfig.extras = {
      experimentalScopedSlotChanges: true,
    };
    const { config } = validateConfig(userConfig, bootstrapConfig);
    expect(config.extras.experimentalScopedSlotChanges).toBe(true);
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

    it('defaults the field to true when not set in the config', () => {
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.sourceMap).toBe(true);
    });
  });

  describe('buildDist', () => {
    it.each([true, false])('should set the field based on the config flag (%p)', (flag) => {
      userConfig.flags = createConfigFlags({ esm: flag });
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.buildDist).toBe(flag);
    });

    it.each([true, false])('should fallback to !devMode', (devMode) => {
      userConfig.devMode = devMode;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.buildDist).toBe(!devMode);
    });

    it.each([true, false])('should fallback to buildEs5 in devMode', (buildEs5) => {
      userConfig.devMode = true;
      userConfig.buildEs5 = buildEs5;
      const { config } = validateConfig(userConfig, bootstrapConfig);
      expect(config.buildDist).toBe(config.buildEs5);
    });
  });

  describe('validatePrimaryPackageOutputTarget', () => {
    it('should default to false', () => {
      const { config } = validateConfig(userConfig, bootstrapConfig);

      expect(config.validatePrimaryPackageOutputTarget).toBe(false);
    });

    it.each([true, false])(
      'should set validatePrimaryPackageOutputTarget to %p',
      (validatePrimaryPackageOutputTarget) => {
        userConfig.validatePrimaryPackageOutputTarget = validatePrimaryPackageOutputTarget;

        const { config } = validateConfig(userConfig, bootstrapConfig);

        expect(config.validatePrimaryPackageOutputTarget).toBe(validatePrimaryPackageOutputTarget);
      },
    );
  });
});
