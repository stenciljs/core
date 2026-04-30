import { isAbsolute } from 'node:path';
import type * as d from '@stencil/core';

import {
  COPY,
  DIST_LAZY,
  isBoolean,
  isOutputTargetLoaderBundle,
  isOutputTargetTypes,
  isString,
  join,
} from '../../../utils';
import { getAbsolutePath } from '../config-utils';
import { validateCopy } from '../validate-copy';

/**
 * Validate the "loader-bundle" output targets.
 *
 * This generates lazy-loaded component bundles with a loader infrastructure,
 * optimized for CDN usage and applications that benefit from on-demand component loading.
 *
 * This function will also add internal output targets (lazy, global-styles, copy)
 * to support the loader-bundle implementation.
 *
 * Note: In v5, `types` and `stencil-rebundle` outputs are auto-generated separately in production builds.
 * The `./loader` export in package.json points directly to the esm/loader.js file.
 *
 * @param config the compiler config
 * @param userOutputs a user-supplied list of output targets
 * @returns a list of OutputTargets which have been validated
 */
export const validateLoaderBundle = (
  config: d.ValidatedConfig,
  userOutputs: d.OutputTarget[],
): d.OutputTarget[] => {
  const loaderBundleOutputTargets = userOutputs.filter(isOutputTargetLoaderBundle);

  const outputs: d.OutputTarget[] = [];

  for (const outputTarget of loaderBundleOutputTargets) {
    const loaderBundleOutput = validateOutputTargetLoaderBundle(config, outputTarget);
    outputs.push(loaderBundleOutput);

    const namespace = config.fsNamespace || 'app';
    const lazyDir = join(loaderBundleOutput.buildDir, namespace);

    // Lazy build for CDN (always generated, even in dev mode)
    outputs.push({
      type: DIST_LAZY,
      esmDir: lazyDir,
      isBrowserBuild: true,
      empty: loaderBundleOutput.empty,
    });
    outputs.push({
      type: COPY,
      dir: lazyDir,
      copy: (loaderBundleOutput.copy ?? []).concat(),
    });

    // Distribution outputs (lazy bundles)
    // Only generated in production mode or when skipInDev=false
    if (!config.devMode || !loaderBundleOutput.skipInDev) {
      const esmDir = join(loaderBundleOutput.dir, 'esm');
      const cjsDir = loaderBundleOutput.cjs ? join(loaderBundleOutput.dir, 'cjs') : undefined;

      // Find the types output target to get the types directory
      const typesOutput = userOutputs.find(isOutputTargetTypes);
      const typesDir = getAbsolutePath(config, typesOutput?.dir ?? 'dist/types');

      // Create lazy output target for distributable bundles
      outputs.push({
        type: DIST_LAZY,
        esmDir,
        cjsDir,
        cjsIndexFile: loaderBundleOutput.cjs
          ? join(loaderBundleOutput.dir, 'index.cjs')
          : undefined,
        esmIndexFile: join(loaderBundleOutput.dir, 'index.js'),
        loaderDir: join(loaderBundleOutput.dir, loaderBundleOutput.loaderPath),
        typesDir,
        empty: loaderBundleOutput.empty,
      });
    }
  }

  return outputs;
};

/**
 * Validate that an OutputTargetLoaderBundle object has what it needs to do its job.
 * To enforce this, we have this function return `Required<d.OutputTargetLoaderBundle>`,
 * giving us a compile-time check that all properties are defined (with either
 * user-supplied or default values).
 *
 * @param config the current config
 * @param o the OutputTargetLoaderBundle object we want to validate
 * @returns `Required<d.OutputTargetLoaderBundle>`, i.e. `d.OutputTargetLoaderBundle`
 * with all optional properties rendered un-optional.
 */
const validateOutputTargetLoaderBundle = (
  config: d.ValidatedConfig,
  o: d.OutputTargetLoaderBundle,
): Required<d.OutputTargetLoaderBundle> => {
  // Create an object with default values for type inference
  const outputTarget = {
    ...o,
    dir: getAbsolutePath(config, o.dir || DEFAULT_DIR),
    buildDir: isString(o.buildDir) ? o.buildDir : DEFAULT_BUILD_DIR,
    copy: validateCopy(o.copy ?? [], []),
    empty: isBoolean(o.empty) ? o.empty : true,
    cjs: isBoolean(o.cjs) ? o.cjs : false,
    loaderPath: isString(o.loaderPath) ? o.loaderPath : DEFAULT_LOADER_PATH,
    // loader-bundle skips distribution artifacts in dev mode by default, but always builds browser/CDN output
    skipInDev: isBoolean(o.skipInDev) ? o.skipInDev : true,
  } satisfies Required<d.OutputTargetLoaderBundle>;

  if (!isAbsolute(outputTarget.buildDir)) {
    outputTarget.buildDir = join(outputTarget.dir, outputTarget.buildDir);
  }

  return outputTarget;
};

const DEFAULT_DIR = 'dist/loader-bundle';
const DEFAULT_BUILD_DIR = '';
const DEFAULT_LOADER_PATH = 'loader';
