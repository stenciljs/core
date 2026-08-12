import { isAbsolute } from 'path';
import ts from 'typescript';
import type * as d from '@stencil/core';

import { normalizePath, resolve } from '../../../utils';
import { addExternalImport } from '../collection/add-external-import';

export const parseModuleImport = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  moduleFile: d.Module,
  dirPath: string,
  importNode: ts.ImportDeclaration,
  resolveCollections: boolean,
) => {
  if (importNode.moduleSpecifier && ts.isStringLiteral(importNode.moduleSpecifier)) {
    let importPath = importNode.moduleSpecifier.text;

    if (!moduleFile.originalImports.includes(importPath)) {
      moduleFile.originalImports.push(importPath);
    }

    if (importPath === '@stencil/core/signals') {
      moduleFile.hasSignalsImport = true;
    }

    if (isAbsolute(importPath)) {
      // absolute import
      importPath = normalizePath(importPath);
      moduleFile.localImports.push(importPath);
    } else if (importPath.startsWith('.')) {
      // relative import
      const resolved = resolve(dirPath, importPath);
      importPath = normalizePath(resolved);
      // TEMP DEBUG (windows build-conditionals investigation)
      console.warn(
        `[DEBUG parseModuleImport] dirPath="${dirPath}" importPath(raw)="${importNode.moduleSpecifier.text}" resolve()="${resolved}" normalized="${importPath}"`,
      );
      moduleFile.localImports.push(importPath);
    } else {
      // node resolve side effect import
      addExternalImport(
        config,
        compilerCtx,
        buildCtx,
        moduleFile,
        moduleFile.sourceFilePath,
        importPath,
        resolveCollections,
        !importNode.importClause,
      );
    }
  }
};
