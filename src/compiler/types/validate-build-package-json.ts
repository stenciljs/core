import {
  COLLECTION_MANIFEST_FILE_NAME,
  isGlob,
  isOutputTargetDistCollection,
  isString,
  join,
  normalizePath,
  relative,
} from '@utils';
import { dirname } from 'path';

import type * as d from '../../declarations';
import { packageJsonError, packageJsonWarn } from './package-json-log-utils';
import { validatePrimaryPackageOutputTarget } from './validate-primary-package-output-target';

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

  // Validate any output target that the user has designated as the "primary"
  // target that is bundled with their distribution
  validatePrimaryPackageOutputTarget(config, compilerCtx, buildCtx);

  const distCollectionOutputTargets = config.outputTargets.filter(isOutputTargetDistCollection);
  await Promise.all(
    distCollectionOutputTargets.map((distCollectionOT) =>
      validateDistCollectionPkgJson(config, compilerCtx, buildCtx, distCollectionOT),
    ),
  );
};

/**
 * Validate package.json contents for the `DIST_COLLECTION` output target,
 * checking that various fields like `files`, `main`, and so on are set
 * correctly.
 *
 * @param config the stencil config
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param outputTarget a DIST_COLLECTION output target
 */
const validateDistCollectionPkgJson = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetDistCollection,
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
 * files that are necessary for the `DIST_COLLECTION` output target.
 *
 * @param config the stencil config
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param outputTarget a DIST_COLLECTION output target
 */
export const validatePackageFiles = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetDistCollection,
) => {
  if (!config.devMode && Array.isArray(buildCtx.packageJson.files)) {
    const actualDistDir = normalizePath(relative(config.rootDir, outputTarget.dir));

    const validPaths = [`${actualDistDir}`, `${actualDistDir}/`, `./${actualDistDir}`, `./${actualDistDir}/`];

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
 * `DIST_COLLECTION` output target.
 *
 * @param config the stencil config
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param outputTarget a DIST_COLLECTION output target
 */
export const validateMain = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetDistCollection,
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
 * `DIST_COLLECTION` output target.
 *
 * @param config the stencil config
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param outputTarget a DIST_COLLECTION output target
 */
export const validateCollection = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetDistCollection,
) => {
  if (outputTarget.collectionDir) {
    const collectionRel = normalizePath(
      join(relative(config.rootDir, outputTarget.collectionDir), COLLECTION_MANIFEST_FILE_NAME),
      false,
    );
    if (!buildCtx.packageJson.collection || normalizePath(buildCtx.packageJson.collection, false) !== collectionRel) {
      const msg = `package.json "collection" property is required when generating a distribution and must be set to: ${collectionRel}`;
      packageJsonWarn(config, compilerCtx, buildCtx, msg, `"collection"`);
    }
  }
};

/**
 * Check that the `browser` field is set correctly in `package.json` for the
 * `DIST_COLLECTION` output target.
 *
 * @param config the stencil config
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 */
export const validateBrowser = (config: d.ValidatedConfig, compilerCtx: d.CompilerCtx, buildCtx: d.BuildCtx) => {
  if (isString(buildCtx.packageJson.browser)) {
    const msg = `package.json "browser" property is set to "${buildCtx.packageJson.browser}". However, for maximum compatibility with all bundlers it's recommended to not set the "browser" property and instead ensure both "module" and "main" properties are set.`;
    packageJsonWarn(config, compilerCtx, buildCtx, msg, `"browser"`);
  }
};
