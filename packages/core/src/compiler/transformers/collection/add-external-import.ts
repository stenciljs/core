import { dirname } from 'path';
import type * as d from '@stencil/core';

import { isString, join, normalizePath, parsePackageJson } from '../../../utils';
import { tsResolveModuleNamePackageJsonPath } from '../../sys/typescript/typescript-resolve-module';
import { parseCollection } from './parse-collection-module';

/**
 * Resolve a package by moduleId, check if it's a Stencil collection, and ingest it into the
 * build context (including transitive collection dependencies).
 * @param config the Stencil configuration associated with the project being compiled
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param containingFile the file path of the module that contains the import being resolved
 * @param moduleId the bare module ID being imported (e.g. 'my-lib' or '@my-scope/my-lib')
 * @param resolveCollections whether to resolve and ingest collections found, or just check if the import is a collection without ingesting it
 */
const resolveAndIngestCollection = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  containingFile: string,
  moduleId: string,
  resolveCollections: boolean,
) => {
  if (!resolveCollections || compilerCtx.resolvedCollections.has(moduleId)) {
    return;
  }

  let pkgJsonFilePath = tsResolveModuleNamePackageJsonPath(
    config,
    compilerCtx,
    moduleId,
    containingFile,
  );

  // cache that we've already parsed this
  compilerCtx.resolvedCollections.add(moduleId);

  if (pkgJsonFilePath == null) {
    return;
  }

  const realPkgJsonFilePath = config.sys.realpathSync(pkgJsonFilePath);
  if (realPkgJsonFilePath.path) {
    pkgJsonFilePath = realPkgJsonFilePath.path;
  }

  // realpathSync may return a path that uses Windows path separators ('\').
  // normalize it for the purposes of this comparison
  if (normalizePath(pkgJsonFilePath) === config.packageJsonFilePath) {
    // same package silly!
    return;
  }

  // open up and parse the package.json
  // sync on purpose :(
  const pkgJsonStr = compilerCtx.fs.readFileSync(pkgJsonFilePath);
  if (pkgJsonStr == null) {
    return;
  }
  const parsedPkgJson = parsePackageJson(pkgJsonStr, pkgJsonFilePath);
  if (parsedPkgJson.diagnostic) {
    buildCtx.diagnostics.push(parsedPkgJson.diagnostic);
    return;
  }

  // Check for collection (v5) or collection (v4) field
  const collectionManifestPath = parsedPkgJson.data.collection ?? parsedPkgJson.data.collection;
  if (!isString(collectionManifestPath) || !collectionManifestPath.endsWith('.json')) {
    // this import is not a stencil collection
    return;
  }

  if (!isString(parsedPkgJson.data.types) || !parsedPkgJson.data.types.endsWith('.d.ts')) {
    // this import should have types
    return;
  }

  // this import is a stencil collection
  // let's parse it and gather all the module data about it
  // internally it'll cached collection data if we've already done this
  const collection = parseCollection(
    config,
    compilerCtx,
    buildCtx,
    moduleId,
    parsedPkgJson.filePath,
    parsedPkgJson.data,
  );
  if (!collection) {
    return;
  }

  // check if we already added this collection to the build context
  const alreadyHasCollection = buildCtx.collections.some((c) => {
    return c.collectionName === collection.collectionName;
  });

  if (alreadyHasCollection) {
    return;
  }

  // let's add the collection to the build context
  buildCtx.collections.push(collection);

  if (Array.isArray(collection.dependencies)) {
    // this collection has more collections
    // let's keep digging down and discover all of them
    collection.dependencies.forEach((dependencyModuleId) => {
      const resolveFromDir = dirname(pkgJsonFilePath);
      resolveAndIngestCollection(
        config,
        compilerCtx,
        buildCtx,
        resolveFromDir,
        dependencyModuleId,
        resolveCollections,
      );
    });
  }
};

/**
 * Add an external import to a module, and if it's a Stencil collection, ingest it into the build context
 * @param config the Stencil configuration associated with the project being compiled
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param moduleFile the module file object representing the module that contains the import being resolved
 * @param containingFile the file path of the module that contains the import being resolved
 * @param moduleId the bare module ID being imported (e.g. 'my-lib' or '@my-scope/my-lib')
 * @param resolveCollections whether to resolve and ingest collections found, or just check if the import is a collection without ingesting it
 * @param isSideEffectImport whether this is a side-effect-only import (e.g. `import '@pkg'`) or not (e.g. `import { x } from '@pkg'`)
 */
export const addExternalImport = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  moduleFile: d.Module,
  containingFile: string,
  moduleId: string,
  resolveCollections: boolean,
  isSideEffectImport = false,
) => {
  if (!moduleFile.externalImports.includes(moduleId)) {
    moduleFile.externalImports.push(moduleId);
    moduleFile.externalImports.sort();
  }

  // Only ingest a collection if:
  // a) it's a bare side-effect import (`import '@pkg'`), or
  // b) the package is explicitly listed in config.collections
  const isExplicitCollection = config.collections?.includes(moduleId) ?? false;
  if (!isSideEffectImport && !isExplicitCollection) {
    return;
  }

  resolveAndIngestCollection(
    config,
    compilerCtx,
    buildCtx,
    containingFile,
    moduleId,
    resolveCollections,
  );
};

/**
 * Proactively ingest all collections listed in `config.collections` into the build context.
 * Called before transpilation so collection components are available during the TS program run.
 * @param config the Stencil configuration associated with the project being compiled
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 */
export const ingestConfigCollections = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  if (!config.collections?.length) {
    return;
  }
  // Resolve packages relative to the project root
  const containingFile = join(config.rootDir, 'package.json');
  for (const moduleId of config.collections) {
    resolveAndIngestCollection(config, compilerCtx, buildCtx, containingFile, moduleId, true);
  }
};
