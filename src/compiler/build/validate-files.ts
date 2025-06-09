import type * as d from '../../declarations';
import { validateManifestJson } from '../html/validate-manifest-json';
import { validateBuildPackageJson } from '../types/validate-build-package-json';

/**
 * Validate the existence and contents of certain files that were generated after writing the results of the build to
 * disk
 * @param config the Stencil configuration used for the build
 * @param compilerCtx the compiler context associated with the build
 * @param buildCtx the build context associated with the current build
 * @returns an array containing empty-Promise results
 */
export const validateBuildFiles = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<(void | void[] | null)[]> | null => {
  if (buildCtx.hasError) {
    return null;
  }

  return Promise.all([
    validateBuildPackageJson(config, compilerCtx, buildCtx),
    validateManifestJson(config, compilerCtx, buildCtx),
  ]);
};
