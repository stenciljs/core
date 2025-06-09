import {
  COPY,
  DIST_COLLECTION,
  DIST_GLOBAL_STYLES,
  DIST_LAZY,
  DIST_LAZY_LOADER,
  DIST_TYPES,
  getComponentsDtsTypesFilePath,
  isBoolean,
  isOutputTargetDist,
  isString,
  join,
  resolve,
} from '@utils';
import { isAbsolute } from 'path';

import type * as d from '../../../declarations';
import { getAbsolutePath } from '../config-utils';
import { validateCopy } from '../validate-copy';

/**
 * Validate that the "dist" output targets are valid and ready to go.
 *
 * This function will also add in additional output targets to its output, based on the input supplied.
 *
 * @param config the compiler config, what else?
 * @param userOutputs a user-supplied list of output targets.
 * @returns a list of OutputTargets which have been validated for us.
 */
export const validateDist = (config: d.ValidatedConfig, userOutputs: d.OutputTarget[]): d.OutputTarget[] => {
  const distOutputTargets = userOutputs.filter(isOutputTargetDist);

  const outputs: d.OutputTarget[] = [];

  for (const outputTarget of distOutputTargets) {
    const distOutputTarget = validateOutputTargetDist(config, outputTarget);
    outputs.push(distOutputTarget);

    const namespace = config.fsNamespace || 'app';
    const lazyDir = join(distOutputTarget.buildDir, namespace);

    // Lazy build for CDN in dist
    outputs.push({
      type: DIST_LAZY,
      esmDir: lazyDir,
      systemDir: config.buildEs5 ? lazyDir : undefined,
      systemLoaderFile: config.buildEs5 ? join(lazyDir, namespace + '.js') : undefined,
      legacyLoaderFile: join(distOutputTarget.buildDir, namespace + '.js'),
      polyfills: outputTarget.polyfills !== undefined ? !!distOutputTarget.polyfills : true,
      isBrowserBuild: true,
      empty: distOutputTarget.empty,
    });
    outputs.push({
      type: COPY,
      dir: lazyDir,
      copyAssets: 'dist',
      copy: (distOutputTarget.copy ?? []).concat(),
    });
    outputs.push({
      type: DIST_GLOBAL_STYLES,
      file: join(lazyDir, `${config.fsNamespace}.css`),
    });

    outputs.push({
      type: DIST_TYPES,
      dir: distOutputTarget.dir,
      typesDir: distOutputTarget.typesDir,
    });

    if (config.buildDist) {
      if (distOutputTarget.collectionDir) {
        outputs.push({
          type: DIST_COLLECTION,
          dir: distOutputTarget.dir,
          collectionDir: distOutputTarget.collectionDir,
          empty: distOutputTarget.empty,
          transformAliasedImportPaths: distOutputTarget.transformAliasedImportPathsInCollection,
        });
        outputs.push({
          type: COPY,
          dir: distOutputTarget.collectionDir,
          copyAssets: 'collection',
          copy: [...distOutputTarget.copy, { src: '**/*.svg' }, { src: '**/*.js' }],
        });
      }

      const esmDir = join(distOutputTarget.dir, 'esm');
      const esmEs5Dir = config.buildEs5 ? join(distOutputTarget.dir, 'esm-es5') : undefined;
      const cjsDir = join(distOutputTarget.dir, 'cjs');

      // Create lazy output-target
      outputs.push({
        type: DIST_LAZY,
        esmDir,
        esmEs5Dir,
        cjsDir,

        cjsIndexFile: join(distOutputTarget.dir, 'index.cjs.js'),
        esmIndexFile: join(distOutputTarget.dir, 'index.js'),
        polyfills: true,
        empty: distOutputTarget.empty,
      });

      // Create output target that will generate the /loader entry-point
      outputs.push({
        type: DIST_LAZY_LOADER,
        dir: distOutputTarget.esmLoaderPath,

        esmDir,
        esmEs5Dir,
        cjsDir,
        componentDts: getComponentsDtsTypesFilePath(distOutputTarget),
        empty: distOutputTarget.empty,
      });
    }
  }

  return outputs;
};

/**
 * Validate that an OutputTargetDist object has what it needs to do it's job.
 * To enforce this, we have this function return
 * `Required<d.OutputTargetDist>`, giving us a compile-time check that all
 * properties are defined (with either user-supplied or default values).
 *
 * @param config the current config
 * @param o the OutputTargetDist object we want to validate
 * @returns `Required<d.OutputTargetDist>`, i.e. `d.OutputTargetDist` with all
 * optional properties rendered un-optional.
 */
const validateOutputTargetDist = (config: d.ValidatedConfig, o: d.OutputTargetDist): Required<d.OutputTargetDist> => {
  // we need to create an object with a bunch of default values here so that
  // the typescript compiler can infer their types correctly
  const outputTarget = {
    ...o,
    dir: getAbsolutePath(config, o.dir || DEFAULT_DIR),
    buildDir: isString(o.buildDir) ? o.buildDir : DEFAULT_BUILD_DIR,
    collectionDir: o.collectionDir !== undefined ? o.collectionDir : DEFAULT_COLLECTION_DIR,
    typesDir: o.typesDir || DEFAULT_TYPES_DIR,
    esmLoaderPath: o.esmLoaderPath || DEFAULT_ESM_LOADER_DIR,
    copy: validateCopy(o.copy ?? [], []),
    polyfills: isBoolean(o.polyfills) ? o.polyfills : false,
    empty: isBoolean(o.empty) ? o.empty : true,
    transformAliasedImportPathsInCollection: isBoolean(o.transformAliasedImportPathsInCollection)
      ? o.transformAliasedImportPathsInCollection
      : true,
    isPrimaryPackageOutputTarget: o.isPrimaryPackageOutputTarget ?? false,
  } satisfies Required<d.OutputTargetDist>;

  if (!isAbsolute(outputTarget.buildDir)) {
    outputTarget.buildDir = join(outputTarget.dir, outputTarget.buildDir);
  }

  if (outputTarget.collectionDir && !isAbsolute(outputTarget.collectionDir)) {
    outputTarget.collectionDir = join(outputTarget.dir, outputTarget.collectionDir);
  }

  if (!isAbsolute(outputTarget.esmLoaderPath)) {
    outputTarget.esmLoaderPath = resolve(outputTarget.dir, outputTarget.esmLoaderPath);
  }

  if (!isAbsolute(outputTarget.typesDir)) {
    outputTarget.typesDir = join(outputTarget.dir, outputTarget.typesDir);
  }

  return outputTarget;
};

const DEFAULT_DIR = 'dist';
const DEFAULT_BUILD_DIR = '';
const DEFAULT_COLLECTION_DIR = 'collection';
const DEFAULT_TYPES_DIR = 'types';
const DEFAULT_ESM_LOADER_DIR = 'loader';
