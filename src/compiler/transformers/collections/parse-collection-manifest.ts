import { join, normalizePath } from '@utils';

import type * as d from '../../../declarations';
import { parseCollectionComponents, transpileCollectionModule } from './parse-collection-components';

export const parseCollectionManifest = (
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
    dependencies: parseCollectionDependencies(collectionManifest),
    compiler: {
      name: compilerVersion.name || '',
      version: compilerVersion.version || '',
      typescriptVersion: compilerVersion.typescriptVersion || '',
    },
    bundles: parseBundles(collectionManifest),
  };

  parseGlobal(config, compilerCtx, buildCtx, collectionDir, collectionManifest, collection);
  parseCollectionComponents(config, compilerCtx, buildCtx, collectionDir, collectionManifest, collection);

  return collection;
};

export const parseCollectionDependencies = (collectionManifest: d.CollectionManifest) => {
  return (collectionManifest.collections || []).map((c) => c.name);
};

export const parseGlobal = (
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
  const globalModule = transpileCollectionModule(config, compilerCtx, buildCtx, collection, sourceFilePath);
  collection.global = globalModule;
};

export const parseBundles = (collectionManifest: d.CollectionManifest) => {
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
