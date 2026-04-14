import { dirname } from 'path';
import type * as d from '@stencil/core';

import {
  COLLECTION_MANIFEST_FILE_NAME,
  isGlob,
  isOutputTargetStencilMeta,
  isString,
  join,
  normalizePath,
  relative,
} from '../../utils';
import { packageJsonError, packageJsonWarn } from './package-json-log-utils';
import { validatePackageJson } from './validate-package-json';

/**
 * Validate the package.json file for a project, checking that various fields
 * are set correctly for the currently-configured output targets.
 *
 * @param config the project's Stencil config
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 * @returns an empty Promise
 */
export const validateBuildPackageJson = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<void> => {
  if (config.watch || buildCtx.packageJson == null) {
    return;
  }

  // Validate package.json fields based on configured output targets
  validatePackageJson(config, compilerCtx, buildCtx);

  const stencilMetaOutputTargets = config.outputTargets.filter(isOutputTargetStencilMeta);
  await Promise.all(
    stencilMetaOutputTargets.map((stencilMetaOT) =>
      validateStencilMetaPkgJson(config, compilerCtx, buildCtx, stencilMetaOT),
    ),
  );
};

/**
 * Validate package.json contents for the `STENCIL_META` output target,
 * checking that various fields like `files`, `main`, and so on are set
 * correctly.
 *
 * @param config the stencil config
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param outputTarget a STENCIL_META output target
 */
const validateStencilMetaPkgJson = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetStencilMeta,
) => {
  await Promise.all([
    validatePackageFiles(config, compilerCtx, buildCtx, outputTarget),
    validateMain(config, compilerCtx, buildCtx, outputTarget),
    validateCollection(config, compilerCtx, buildCtx, outputTarget),
    validateBrowser(config, compilerCtx, buildCtx),
  ]);
};

/**
 * Validate that the `files` field in `package.json` contains directories and
 * files that are necessary for the `STENCIL_META` output target.
 *
 * @param config the stencil config
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param outputTarget a STENCIL_META output target
 */
export const validatePackageFiles = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetStencilMeta,
) => {
  if (!config.devMode && Array.isArray(buildCtx.packageJson.files)) {
    const actualDistDir = normalizePath(relative(config.rootDir, outputTarget.dir));

    const validPaths = [
      `${actualDistDir}`,
      `${actualDistDir}/`,
      `./${actualDistDir}`,
      `./${actualDistDir}/`,
    ];

    const containsDistDir = buildCtx.packageJson.files.some((userPath) =>
      validPaths.some((validPath) => normalizePath(userPath) === validPath),
    );

    if (!containsDistDir) {
      const msg = `package.json "files" array must contain the distribution directory "${actualDistDir}/" when generating a distribution.`;
      packageJsonWarn(config, compilerCtx, buildCtx, msg, `"files"`);
      return;
    }

    await Promise.all(
      buildCtx.packageJson.files.map(async (pkgFile) => {
        if (!isGlob(pkgFile)) {
          const packageJsonDir = dirname(config.packageJsonFilePath);
          const absPath = join(packageJsonDir, pkgFile);

          const hasAccess = await compilerCtx.fs.access(absPath);
          if (!hasAccess) {
            const msg = `Unable to find "${pkgFile}" within the package.json "files" array.`;
            packageJsonError(config, compilerCtx, buildCtx, msg, `"${pkgFile}"`);
          }
        }
      }),
    );
  }
};

/**
 * Check that the `main` field is set correctly in `package.json` for the
 * `STENCIL_META` output target.
 *
 * @param config the stencil config
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param outputTarget a STENCIL_META output target
 */
export const validateMain = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetStencilMeta,
) => {
  const mainAbs = join(outputTarget.dir, 'index.cjs.js');
  const mainRel = relative(config.rootDir, mainAbs);

  if (!isString(buildCtx.packageJson.main) || buildCtx.packageJson.main === '') {
    const msg = `package.json "main" property is required when generating a distribution. It's recommended to set the "main" property to: ${mainRel}`;
    packageJsonWarn(config, compilerCtx, buildCtx, msg, `"main"`);
  } else if (normalizePath(buildCtx.packageJson.main) !== normalizePath(mainRel)) {
    const msg = `package.json "main" property is set to "${buildCtx.packageJson.main}". It's recommended to set the "main" property to: ${mainRel}`;
    packageJsonWarn(config, compilerCtx, buildCtx, msg, `"main"`);
  }
};

/**
 * Check that the `collection` field is set correctly in `package.json` for the
 * `STENCIL_META` output target.
 *
 * @param config the stencil config
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param outputTarget a STENCIL_META output target
 */
export const validateCollection = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetStencilMeta,
) => {
  if (outputTarget.dir) {
    const collectionRel = normalizePath(
      join(relative(config.rootDir, outputTarget.dir), COLLECTION_MANIFEST_FILE_NAME),
      false,
    );
    if (
      !buildCtx.packageJson.collection ||
      normalizePath(buildCtx.packageJson.collection, false) !== collectionRel
    ) {
      const msg = `package.json "collection" property is required when generating a distribution and must be set to: ${collectionRel}`;
      packageJsonWarn(config, compilerCtx, buildCtx, msg, `"collection"`);
    }
  }
};

/**
 * Check that the `browser` field is set correctly in `package.json` for the
 * `STENCIL_META` output target.
 *
 * @param config the stencil config
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 */
const validateBrowser = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  if (isString(buildCtx.packageJson.browser)) {
    const msg = `package.json "browser" property is set to "${buildCtx.packageJson.browser}". However, for maximum compatibility with all bundlers it's recommended to not set the "browser" property and instead ensure both "module" and "main" properties are set.`;
    packageJsonWarn(config, compilerCtx, buildCtx, msg, `"browser"`);
  }
};
