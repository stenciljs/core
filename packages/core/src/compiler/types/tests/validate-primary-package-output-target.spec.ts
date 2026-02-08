import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';

import type * as d from '../../../declarations';
import {
  PRIMARY_PACKAGE_TARGET_CONFIGS,
  PrimaryPackageOutputTargetRecommendedConfig,
  validateModulePath,
  validatePrimaryPackageOutputTarget,
  validateTypesPath,
} from '../validate-primary-package-output-target';

describe('validatePrimaryPackageOutputTarget', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;

  beforeEach(() => {
    config = mockValidatedConfig({
      validatePrimaryPackageOutputTarget: true,
      outputTargets: [
        {
          type: 'dist',
          isPrimaryPackageOutputTarget: true,
          dir: '/dist',
          typesDir: '/dist/types',
        },
      ],
    });

    compilerCtx = mockCompilerCtx(config);
    compilerCtx.fs.accessSync = () => true;

    buildCtx = mockBuildCtx(config, compilerCtx);
    buildCtx.packageJson.module = 'dist/index.js';
    buildCtx.packageJson.types = 'dist/types/index.d.ts';
  });

  describe('check basic Stencil config scenarios', () => {
    it('should log a warning if `validatePrimaryPackageOutputTarget` is `false` but primary targets are set', () => {
      config.validatePrimaryPackageOutputTarget = false;

      validatePrimaryPackageOutputTarget(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toEqual('warn');
      expect(buildCtx.diagnostics[0].messageText).toEqual(
        'Your Stencil project has designated a primary package output target without enabling primary package validation for your project. Either set `validatePrimaryPackageOutputTarget: true` in your Stencil config or remove `isPrimaryPackageOutputTarget: true` from all output targets. You can read more about primary package output targets in the Stencil docs: https://stenciljs.com/docs/output-targets#primary-package-output-target-validation',
      );
    });

    it('should log a warning if any non-eligible targets were marked as `isPrimaryPackageOutputTarget`', () => {
      config.outputTargets = [
        {
          type: 'copy',
          isPrimaryPackageOutputTarget: true,
        },
      ] as any[];

      validatePrimaryPackageOutputTarget(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toEqual('warn');
      expect(buildCtx.diagnostics[0].messageText).toEqual(
        `Your Stencil project has assigned one or more ineligible output targets as the primary package output target. No validation will take place. Please remove the 'isPrimaryPackageOutputTarget' flag from the following output targets in your Stencil config: copy. You can read more about primary package output targets in the Stencil docs: https://stenciljs.com/docs/output-targets#primary-package-output-target-validation`,
      );
    });

    it('should log a warning if no eligible targets were marked as `isPrimaryPackageOutputTarget`', () => {
      config.outputTargets = [
        {
          type: 'dist',
        },
      ];

      validatePrimaryPackageOutputTarget(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toEqual('warn');
      expect(buildCtx.diagnostics[0].messageText).toEqual(
        `Your Stencil project has not assigned a primary package output target. Stencil recommends that you assign a primary output target so it can validate values for fields in your project's 'package.json'. You can read more about primary package output targets in the Stencil docs: https://stenciljs.com/docs/output-targets#primary-package-output-target-validation`,
      );
    });

    it('should log a warning if multiple targets were marked as `isPrimaryPackageOutputTarget`', () => {
      config.outputTargets = [
        ...config.outputTargets,
        {
          type: 'dist-custom-elements',
          isPrimaryPackageOutputTarget: true,
        },
      ];

      validatePrimaryPackageOutputTarget(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toEqual('warn');
      expect(buildCtx.diagnostics[0].messageText).toEqual(
        `Your Stencil config has multiple output targets with 'isPrimaryPackageOutputTarget: true'. Stencil does not support validating 'package.json' fields for multiple output targets. Please remove the 'isPrimaryPackageOutputTarget' flag from all but one of the following output targets: dist, dist-custom-elements. For now, Stencil will use the first primary target it finds. You can read more about primary package output targets in the Stencil docs: https://stenciljs.com/docs/output-targets#primary-package-output-target-validation`,
      );
    });
  });

  describe('validateModulePath', () => {
    it('should log a warning if no module path is provided', () => {
      delete buildCtx.packageJson.module;

      const targetToValidate: d.EligiblePrimaryPackageOutputTarget = {
        type: 'dist',
        dir: '/dist',
      };
      const recommendedOutputTargetConfig = PRIMARY_PACKAGE_TARGET_CONFIGS[targetToValidate.type];

      validateModulePath(config, compilerCtx, buildCtx, recommendedOutputTargetConfig, targetToValidate);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toEqual('warn');
      expect(buildCtx.diagnostics[0].messageText).toEqual(
        `package.json "module" property is required when generating a distribution. It's recommended to set the "module" property to: ./dist/index.js`,
      );
    });

    describe.each<[d.EligiblePrimaryPackageOutputTarget & { toString(): string }, string]>([
      [
        {
          type: 'dist',
          dir: '/dist',
          toString: () => 'dist',
        },
        './dist/index.js',
      ],
      [
        {
          type: 'dist-collection',
          dir: '/dist',
          collectionDir: '/dist/collection',
          toString: () => 'dist-collection',
        },
        './dist/index.js',
      ],
      [
        {
          type: 'dist-custom-elements',
          dir: '/dist/components',
          toString: () => 'dist-custom-elements',
        },
        './dist/components/index.js',
      ],
    ])('output target type - %s', (outputTarget, recommendedPath) => {
      it('should log a warning if the set module path does not match the recommended path', () => {
        buildCtx.packageJson.module = '/dist/tmp/index.js';

        validateModulePath(
          config,
          compilerCtx,
          buildCtx,
          PRIMARY_PACKAGE_TARGET_CONFIGS[outputTarget.type],
          outputTarget,
        );

        expect(buildCtx.diagnostics.length).toBe(1);
        expect(buildCtx.diagnostics[0].level).toEqual('warn');
        expect(buildCtx.diagnostics[0].messageText).toEqual(
          `package.json "module" property is set to "${buildCtx.packageJson.module}". It's recommended to set the "module" property to: ${recommendedPath}`,
        );
      });

      it('should not log a warning if the recommended path is used', () => {
        buildCtx.packageJson.module = recommendedPath;

        validateModulePath(
          config,
          compilerCtx,
          buildCtx,
          PRIMARY_PACKAGE_TARGET_CONFIGS[outputTarget.type],
          outputTarget,
        );

        expect(buildCtx.diagnostics.length).toBe(0);
      });
    });
  });

  describe('validateTypesPath', () => {
    let targetToValidate: d.EligiblePrimaryPackageOutputTarget;
    let recommendedOutputTargetConfig: PrimaryPackageOutputTargetRecommendedConfig;

    beforeEach(() => {
      targetToValidate = {
        type: 'dist-types',
        dir: '/dist/types',
        typesDir: '/dist/types',
      };
      recommendedOutputTargetConfig = PRIMARY_PACKAGE_TARGET_CONFIGS[targetToValidate.type];
    });

    it('should log a warning if no types path is provided', () => {
      delete buildCtx.packageJson.types;

      validateTypesPath(config, compilerCtx, buildCtx, recommendedOutputTargetConfig, targetToValidate);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toEqual('warn');
      expect(buildCtx.diagnostics[0].messageText).toEqual(
        `package.json "types" property is required when generating a distribution. It's recommended to set the "types" property to: ./dist/types/index.d.ts`,
      );
    });

    it('should log a warning if the types path does not have a ".d.ts" extension', () => {
      buildCtx.packageJson.types = '/dist/types/index.ts';

      validateTypesPath(config, compilerCtx, buildCtx, recommendedOutputTargetConfig, targetToValidate);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toEqual('warn');
      expect(buildCtx.diagnostics[0].messageText).toEqual(
        `package.json "types" file must have a ".d.ts" extension. The "types" property is currently set to: /dist/types/index.ts`,
      );
    });

    it('should log a error if the types file cannot be accessed', () => {
      compilerCtx.fs.accessSync = () => false;

      validateTypesPath(config, compilerCtx, buildCtx, recommendedOutputTargetConfig, targetToValidate);

      expect(buildCtx.diagnostics.length).toBe(1);
      expect(buildCtx.diagnostics[0].level).toEqual('error');
      expect(buildCtx.diagnostics[0].messageText).toEqual(
        `package.json "types" property is set to "dist/types/index.d.ts" but cannot be found.`,
      );
    });

    describe.each<[d.EligiblePrimaryPackageOutputTarget & { toString(): string }, string]>([
      [
        {
          type: 'dist',
          dir: '/dist',
          typesDir: '/dist/types',
          toString: () => 'dist',
        },
        './dist/types/index.d.ts',
      ],
      [
        {
          type: 'dist-types',
          dir: '/dist',
          typesDir: '/dist/types',
          toString: () => 'dist-types',
        },
        './dist/types/index.d.ts',
      ],
      [
        {
          type: 'dist-custom-elements',
          dir: '/dist/components',
          generateTypeDeclarations: true,
          toString: () => 'dist-custom-elements',
        },
        './dist/components/index.d.ts',
      ],
    ])('output target type - %s', (outputTarget, recommendedPath) => {
      it('should log a warning if the set types path does not match the recommended path', () => {
        buildCtx.packageJson.types = '/dist/tmp/index.d.ts';

        validateTypesPath(
          config,
          compilerCtx,
          buildCtx,
          PRIMARY_PACKAGE_TARGET_CONFIGS[outputTarget.type],
          outputTarget,
        );

        expect(buildCtx.diagnostics.length).toBe(1);
        expect(buildCtx.diagnostics[0].level).toEqual('warn');
        expect(buildCtx.diagnostics[0].messageText).toEqual(
          `package.json "types" property is set to "${buildCtx.packageJson.types}". It's recommended to set the "types" property to: ${recommendedPath}`,
        );
      });

      it('should not log anything if the recommended path is used and accessible', () => {
        buildCtx.packageJson.types = recommendedPath;

        validateTypesPath(
          config,
          compilerCtx,
          buildCtx,
          PRIMARY_PACKAGE_TARGET_CONFIGS[outputTarget.type],
          targetToValidate,
        );

        expect(buildCtx.diagnostics.length).toBe(0);
      });
    });
  });
});
