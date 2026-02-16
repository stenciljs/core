import { isString, normalizePath, parsePackageJson } from '@utils';
import { dirname } from 'path';

import type * as d from '../../../declarations';
import { tsResolveModuleNamePackageJsonPath } from '../../sys/typescript/typescript-resolve-module';
import { parseCollection } from './parse-collection-module';

export const addExternalImport = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  moduleFile: d.Module,
  containingFile: string,
  moduleId: string,
  resolveCollections: boolean,
) => {
  if (!moduleFile.externalImports.includes(moduleId)) {
    moduleFile.externalImports.push(moduleId);
    moduleFile.externalImports.sort();
  }

  if (!resolveCollections || compilerCtx.resolvedCollections.has(moduleId)) {
    // we've already handled this collection moduleId before
    return;
  }

  let pkgJsonFilePath = tsResolveModuleNamePackageJsonPath(config, compilerCtx, moduleId, containingFile);

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

  if (!isString(parsedPkgJson.data.collection) || !parsedPkgJson.data.collection.endsWith('.json')) {
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
    // we already have this collection in our build context
    return;
  }

  // let's add the collection to the build context
  buildCtx.collections.push(collection);

  if (Array.isArray(collection.dependencies)) {
    // this collection has more collections
    // let's keep digging down and discover all of them
    collection.dependencies.forEach((dependencyModuleId) => {
      const resolveFromDir = dirname(pkgJsonFilePath);
      addExternalImport(
        config,
        compilerCtx,
        buildCtx,
        moduleFile,
        resolveFromDir,
        dependencyModuleId,
        resolveCollections,
      );
    });
  }
};
