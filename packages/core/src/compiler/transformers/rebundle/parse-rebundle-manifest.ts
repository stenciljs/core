import type * as d from '@stencil/core';

import { join, normalizePath } from '../../../utils';
import { parseRebundleComponents, transpileRebundleModule } from './parse-rebundle-components';

export const parseRebundleManifest = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  collectionName: string,
  collectionDir: string,
  collectionJsonStr: string,
) => {
  const collectionManifest: d.CollectionManifest = JSON.parse(collectionJsonStr);

  const compilerVersion: d.CollectionCompilerVersion = collectionManifest.compiler || ({} as any);

  const collection: d.CollectionCompilerMeta = {
    collectionName: collectionName,
    moduleId: collectionName,
    moduleDir: collectionDir,
    moduleFiles: [],
    dependencies: parseRebundleDependencies(collectionManifest),
    compiler: {
      name: compilerVersion.name || '',
      version: compilerVersion.version || '',
      typescriptVersion: compilerVersion.typescriptVersion || '',
    },
    bundles: parseBundles(collectionManifest),
  };

  parseGlobal(config, compilerCtx, buildCtx, collectionDir, collectionManifest, collection);
  parseRebundleComponents(
    config,
    compilerCtx,
    buildCtx,
    collectionDir,
    collectionManifest,
    collection,
  );

  return collection;
};

const parseRebundleDependencies = (collectionManifest: d.CollectionManifest) => {
  return (collectionManifest.collections || []).map((c) => c.name);
};

const parseGlobal = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  collectionDir: string,
  collectionManifest: d.CollectionManifest,
  collection: d.CollectionCompilerMeta,
) => {
  if (typeof collectionManifest.global !== 'string') {
    return;
  }

  const sourceFilePath = normalizePath(join(collectionDir, collectionManifest.global));
  const globalModule = transpileRebundleModule(
    config,
    compilerCtx,
    buildCtx,
    collection,
    sourceFilePath,
  );
  collection.global = globalModule;
};

const parseBundles = (collectionManifest: d.CollectionManifest) => {
  if (invalidArrayData(collectionManifest.bundles)) {
    return [];
  }

  return collectionManifest.bundles.map((b) => {
    return {
      components: b.components.slice().sort(),
    };
  });
};

const invalidArrayData = (arr: any[]) => {
  return !arr || !Array.isArray(arr) || arr.length === 0;
};
