import { isAbsolute } from 'path';
import ts from 'typescript';
import type * as d from '@stencil/core';

import { join, normalizePath } from '../../../utils';
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
      //
      // `dirPath` is always an already-normalized, Stencil-absolute path (derived
      // from a source file's own fileName), so `join` is used here instead of
      // `resolve` - `resolve` falls through to native path.resolve() when given an
      // "absolute" path with no drive letter (as our normalized paths are on
      // Windows), which fills in process.cwd()'s real drive letter and corrupts
      // the path. `join` never touches process.cwd().
      importPath = normalizePath(join(dirPath, importPath));
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
