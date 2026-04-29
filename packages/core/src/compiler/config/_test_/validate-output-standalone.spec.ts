import path from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockConfig, mockLoadConfigInit } from '../../../testing';
import { ASSETS, COPY, LOADER_BUNDLE, STENCIL_REBUNDLE, STANDALONE, TYPES, join } from '../../../utils';
import { validateConfig } from '../validate-config';

describe('validate-output-standalone', () => {
  describe('validateStandalone', () => {
    // use Node's resolve() here to simulate a user using either Win/Posix separators (depending on the platform these
    // tests are run on)
    const rootDir = path.resolve('/');
    const defaultDistDir = join(rootDir, 'dist', 'standalone');
    const distCustomElementsDir = 'my-standalone';

    // Assets output target is auto-generated for all builds
    const assetsOutputTarget: d.OutputTargetAssets = {
      type: ASSETS,
      dir: join(rootDir, 'dist', 'assets'),
      skipInDev: false,
    };

    let userConfig: d.Config;

    beforeEach(() => {
      userConfig = mockConfig();
    });

    it('generates a default standalone output target', () => {
      const outputTarget: d.OutputTargetStandalone = {
        type: STANDALONE,
      };
      userConfig.outputTargets = [outputTarget];

      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      expect(config.outputTargets).toEqual([
        assetsOutputTarget,
        {
          type: STANDALONE,
          copy: [],
          dir: defaultDistDir,
          empty: true,
          externalRuntime: true,

          customElementsExportBehavior: 'default',
          skipInDev: false,
        },
      ]);
    });

    it('uses a provided export behavior over the default value', () => {
      const outputTarget: d.OutputTargetStandalone = {
        type: STANDALONE,
        customElementsExportBehavior: 'single-export-module',
      };
      userConfig.outputTargets = [outputTarget];

      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      expect(config.outputTargets).toEqual([
        assetsOutputTarget,
        {
          type: STANDALONE,
          copy: [],
          dir: defaultDistDir,
          empty: true,
          externalRuntime: true,
          customElementsExportBehavior: 'single-export-module',
          skipInDev: false,
        },
      ]);
    });

    it('uses the default export behavior if the specified value is invalid', () => {
      const outputTarget: d.OutputTargetStandalone = {
        type: STANDALONE,
        customElementsExportBehavior: 'not-a-valid-option' as d.CustomElementsExportBehavior,
      };
      userConfig.outputTargets = [outputTarget];

      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      expect(config.outputTargets).toEqual([
        assetsOutputTarget,
        {
          type: STANDALONE,
          copy: [],
          dir: defaultDistDir,
          empty: true,
          externalRuntime: true,

          customElementsExportBehavior: 'default',
          skipInDev: false,
        },
      ]);
    });

    it('uses a provided dir field over a default directory', () => {
      const outputTarget: d.OutputTargetStandalone = {
        type: STANDALONE,
        dir: distCustomElementsDir,
      };
      userConfig.outputTargets = [outputTarget];

      const { config } = validateConfig(userConfig, mockLoadConfigInit());
      expect(config.outputTargets).toEqual([
        assetsOutputTarget,
        {
          type: STANDALONE,
          copy: [],
          dir: join(rootDir, distCustomElementsDir),
          empty: true,
          externalRuntime: true,

          customElementsExportBehavior: 'default',
          skipInDev: false,
        },
      ]);
    });

    describe('"empty" field', () => {
      it('defaults the "empty" field to true if not provided', () => {
        const outputTarget: d.OutputTargetStandalone = {
          type: STANDALONE,
          externalRuntime: false,
        };
        userConfig.outputTargets = [outputTarget];

        const { config } = validateConfig(userConfig, mockLoadConfigInit());
        expect(config.outputTargets).toEqual([
          assetsOutputTarget,
          {
            type: STANDALONE,
            copy: [],
            dir: defaultDistDir,
            empty: true,
            externalRuntime: false,

            customElementsExportBehavior: 'default',
            skipInDev: false,
          },
        ]);
      });

      it('defaults the "empty" field to true it\'s not a boolean', () => {
        const outputTarget: d.OutputTargetStandalone = {
          type: STANDALONE,
          empty: undefined,
          externalRuntime: false,
        };
        userConfig.outputTargets = [outputTarget];

        const { config } = validateConfig(userConfig, mockLoadConfigInit());
        expect(config.outputTargets).toEqual([
          assetsOutputTarget,
          {
            type: STANDALONE,
            copy: [],
            dir: defaultDistDir,
            empty: true,
            externalRuntime: false,

            customElementsExportBehavior: 'default',
            skipInDev: false,
          },
        ]);
      });
    });

    describe('"externalRuntime" field', () => {
      it('defaults the "externalRuntime" field to true if not provided', () => {
        const outputTarget: d.OutputTargetStandalone = {
          type: STANDALONE,
          empty: false,
        };
        userConfig.outputTargets = [outputTarget];

        const { config } = validateConfig(userConfig, mockLoadConfigInit());
        expect(config.outputTargets).toEqual([
          assetsOutputTarget,
          {
            type: STANDALONE,
            copy: [],
            dir: defaultDistDir,
            empty: false,
            externalRuntime: true,

            customElementsExportBehavior: 'default',
            skipInDev: false,
          },
        ]);
      });

      it('defaults the "externalRuntime" field to true it\'s not a boolean', () => {
        const outputTarget: d.OutputTargetStandalone = {
          type: STANDALONE,
          empty: false,
          externalRuntime: undefined,
        };
        userConfig.outputTargets = [outputTarget];

        const { config } = validateConfig(userConfig, mockLoadConfigInit());
        expect(config.outputTargets).toEqual([
          assetsOutputTarget,
          {
            type: STANDALONE,
            copy: [],
            dir: defaultDistDir,
            empty: false,
            externalRuntime: true,

            customElementsExportBehavior: 'default',
            skipInDev: false,
          },
        ]);
      });
    });

    describe('copy tasks', () => {
      it('copies existing copy tasks over to the output target', () => {
        const copyOutputTarget: d.CopyTask = {
          src: 'mock/src',
          dest: 'mock/dest',
        };
        const copyOutputTarget2: d.CopyTask = {
          src: 'mock/src2',
          dest: 'mock/dest2',
        };

        const outputTarget: d.OutputTargetStandalone = {
          type: STANDALONE,
          copy: [copyOutputTarget, copyOutputTarget2],
          dir: distCustomElementsDir,
          empty: false,
          externalRuntime: false,
        };
        userConfig.outputTargets = [outputTarget];

        const { config } = validateConfig(userConfig, mockLoadConfigInit());
        expect(config.outputTargets).toEqual([
          assetsOutputTarget,
          {
            type: COPY,
            dir: rootDir,
            copy: [copyOutputTarget, copyOutputTarget2],
          },
          {
            type: STANDALONE,
            copy: [copyOutputTarget, copyOutputTarget2],
            dir: join(rootDir, distCustomElementsDir),
            empty: false,
            externalRuntime: false,

            customElementsExportBehavior: 'default',
            skipInDev: false,
          },
        ]);
      });
    });

    describe('"autoLoader" field', () => {
      it('normalizes autoLoader: true to an object with defaults', () => {
        const outputTarget: d.OutputTargetStandalone = {
          type: STANDALONE,
          autoLoader: true,
        };
        userConfig.outputTargets = [outputTarget];

        const { config } = validateConfig(userConfig, mockLoadConfigInit());
        const distCustomElementsTarget = config.outputTargets.find(
          (o) => o.type === STANDALONE,
        ) as d.OutputTargetStandalone;

        expect(distCustomElementsTarget.autoLoader).toEqual({
          fileName: 'loader',
          autoStart: true,
        });
      });

      it('normalizes autoLoader object with partial options', () => {
        const outputTarget: d.OutputTargetStandalone = {
          type: STANDALONE,
          autoLoader: { fileName: 'my-loader' },
        };
        userConfig.outputTargets = [outputTarget];

        const { config } = validateConfig(userConfig, mockLoadConfigInit());
        const distCustomElementsTarget = config.outputTargets.find(
          (o) => o.type === STANDALONE,
        ) as d.OutputTargetStandalone;

        expect(distCustomElementsTarget.autoLoader).toEqual({
          fileName: 'my-loader',
          autoStart: true,
        });
      });

      it('normalizes autoLoader object with autoStart: false', () => {
        const outputTarget: d.OutputTargetStandalone = {
          type: STANDALONE,
          autoLoader: { autoStart: false },
        };
        userConfig.outputTargets = [outputTarget];

        const { config } = validateConfig(userConfig, mockLoadConfigInit());
        const distCustomElementsTarget = config.outputTargets.find(
          (o) => o.type === STANDALONE,
        ) as d.OutputTargetStandalone;

        expect(distCustomElementsTarget.autoLoader).toEqual({
          fileName: 'loader',
          autoStart: false,
        });
      });

      it('does not set autoLoader when not provided', () => {
        const outputTarget: d.OutputTargetStandalone = {
          type: STANDALONE,
        };
        userConfig.outputTargets = [outputTarget];

        const { config } = validateConfig(userConfig, mockLoadConfigInit());
        const distCustomElementsTarget = config.outputTargets.find(
          (o) => o.type === STANDALONE,
        ) as d.OutputTargetStandalone;

        expect(distCustomElementsTarget.autoLoader).toBeUndefined();
      });

      it('does not set autoLoader when explicitly false', () => {
        const outputTarget: d.OutputTargetStandalone = {
          type: STANDALONE,
          autoLoader: false,
        };
        userConfig.outputTargets = [outputTarget];

        const { config } = validateConfig(userConfig, mockLoadConfigInit());
        const distCustomElementsTarget = config.outputTargets.find(
          (o) => o.type === STANDALONE,
        ) as d.OutputTargetStandalone;

        expect(distCustomElementsTarget.autoLoader).toBe(false);
      });
    });

    describe('"skipInDev" field', () => {
      it('defaults to false when standalone is the primary output (no loader-bundle)', () => {
        const outputTarget: d.OutputTargetStandalone = {
          type: STANDALONE,
        };
        userConfig.outputTargets = [outputTarget];

        const { config } = validateConfig(userConfig, mockLoadConfigInit());
        const standaloneTarget = config.outputTargets.find(
          (o) => o.type === STANDALONE,
        ) as d.OutputTargetStandalone;

        expect(standaloneTarget.skipInDev).toBe(false);
      });

      it('defaults to true when loader-bundle is also configured (standalone is secondary)', () => {
        userConfig.outputTargets = [{ type: STANDALONE }, { type: LOADER_BUNDLE }];

        const { config } = validateConfig(userConfig, mockLoadConfigInit());
        const standaloneTarget = config.outputTargets.find(
          (o) => o.type === STANDALONE,
        ) as d.OutputTargetStandalone;

        expect(standaloneTarget.skipInDev).toBe(true);
      });

      it('respects explicit skipInDev: false even with loader-bundle', () => {
        userConfig.outputTargets = [{ type: STANDALONE, skipInDev: false }, { type: LOADER_BUNDLE }];

        const { config } = validateConfig(userConfig, mockLoadConfigInit());
        const standaloneTarget = config.outputTargets.find(
          (o) => o.type === STANDALONE,
        ) as d.OutputTargetStandalone;

        expect(standaloneTarget.skipInDev).toBe(false);
      });

      it('respects explicit skipInDev: true even without loader-bundle', () => {
        userConfig.outputTargets = [{ type: STANDALONE, skipInDev: true }];

        const { config } = validateConfig(userConfig, mockLoadConfigInit());
        const standaloneTarget = config.outputTargets.find(
          (o) => o.type === STANDALONE,
        ) as d.OutputTargetStandalone;

        expect(standaloneTarget.skipInDev).toBe(true);
      });
    });
  });

  describe('production mode auto-generation', () => {
    let prodConfig: d.Config;

    beforeEach(() => {
      prodConfig = mockConfig({ devMode: false });
    });

    it('auto-generates types alongside standalone in production mode', () => {
      prodConfig.outputTargets = [{ type: STANDALONE }];
      const { config } = validateConfig(prodConfig, mockLoadConfigInit());
      expect(config.outputTargets.some((o) => o.type === TYPES)).toBe(true);
      expect(config.outputTargets.some((o) => o.type === STANDALONE)).toBe(true);
    });

    it('auto-generates stencil-rebundle alongside standalone in production mode', () => {
      prodConfig.outputTargets = [{ type: STANDALONE }];
      const { config } = validateConfig(prodConfig, mockLoadConfigInit());
      expect(config.outputTargets.some((o) => o.type === STENCIL_REBUNDLE)).toBe(true);
    });

    it('does not duplicate types if already explicitly configured', () => {
      prodConfig.outputTargets = [{ type: STANDALONE }, { type: TYPES, dir: 'my-types' }];
      const { config } = validateConfig(prodConfig, mockLoadConfigInit());
      expect(config.outputTargets.filter((o) => o.type === TYPES)).toHaveLength(1);
    });

    it('does not auto-generate types or stencil-rebundle in dev mode', () => {
      const devConfig = mockConfig({ devMode: true });
      devConfig.outputTargets = [{ type: STANDALONE }];
      const { config } = validateConfig(devConfig, mockLoadConfigInit());
      expect(config.outputTargets.some((o) => o.type === TYPES)).toBe(false);
      expect(config.outputTargets.some((o) => o.type === STENCIL_REBUNDLE)).toBe(false);
    });
  });
});
