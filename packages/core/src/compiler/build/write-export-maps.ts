import {
  isEligiblePrimaryPackageOutputTarget,
  isOutputTargetDistCustomElements,
  isOutputTargetDistLazyLoader,
} from '@utils';
import { relative } from '@utils';
import { execSync } from 'child_process';

import * as d from '../../declarations';
import { PRIMARY_PACKAGE_TARGET_CONFIGS } from '../types/validate-primary-package-output-target';

/**
 * Create export map entry point definitions for the `package.json` file using the npm CLI.
 * This will generate a root entry point for the package, as well as entry points for each component and
 * the lazy loader (if applicable).
 *
 * @param config The validated Stencil config
 * @param buildCtx The build context containing the components to generate export maps for
 */
export const writeExportMaps = (config: d.ValidatedConfig, buildCtx: d.BuildCtx) => {
  const eligiblePrimaryTargets = config.outputTargets.filter(isEligiblePrimaryPackageOutputTarget);
  if (eligiblePrimaryTargets.length > 0) {
    const primaryTarget =
      eligiblePrimaryTargets.find((o) => o.isPrimaryPackageOutputTarget) ?? eligiblePrimaryTargets[0];
    const outputTargetConfig = PRIMARY_PACKAGE_TARGET_CONFIGS[primaryTarget.type];

    if (outputTargetConfig.getModulePath) {
      const importPath = outputTargetConfig.getModulePath(config.rootDir, primaryTarget.dir!);

      if (importPath) {
        execSync(`npm pkg set "exports[.][import]"="${importPath}"`);
      }
    }

    if (outputTargetConfig.getMainPath) {
      const requirePath = outputTargetConfig.getMainPath(config.rootDir, primaryTarget.dir!);

      if (requirePath) {
        execSync(`npm pkg set "exports[.][require]"="${requirePath}"`);
      }
    }

    if (outputTargetConfig.getTypesPath) {
      const typesPath = outputTargetConfig.getTypesPath(config.rootDir, primaryTarget);

      if (typesPath) {
        execSync(`npm pkg set "exports[.][types]"="${typesPath}"`);
      }
    }
  }

  const distLazyLoader = config.outputTargets.find(isOutputTargetDistLazyLoader);
  if (distLazyLoader != null) {
    // Calculate relative path from project root to lazy-loader output directory
    let outDir = relative(config.rootDir, distLazyLoader.dir);
    if (!outDir.startsWith('.')) {
      outDir = './' + outDir;
    }

    execSync(`npm pkg set "exports[./loader][import]"="${outDir}/index.js"`);
    execSync(`npm pkg set "exports[./loader][require]"="${outDir}/index.cjs"`);
    execSync(`npm pkg set "exports[./loader][types]"="${outDir}/index.d.ts"`);
  }

  const distCustomElements = config.outputTargets.find(isOutputTargetDistCustomElements);
  if (distCustomElements != null) {
    // Calculate relative path from project root to custom elements output directory
    let outDir = relative(config.rootDir, distCustomElements.dir!);
    if (!outDir.startsWith('.')) {
      outDir = './' + outDir;
    }

    buildCtx.components.forEach((cmp) => {
      execSync(`npm pkg set "exports[./${cmp.tagName}][import]"="${outDir}/${cmp.tagName}.js"`);

      if (distCustomElements.generateTypeDeclarations) {
        execSync(`npm pkg set "exports[./${cmp.tagName}][types]"="${outDir}/${cmp.tagName}.d.ts"`);
      }
    });
  }
};
