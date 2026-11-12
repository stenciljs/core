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
    const importPath = importNode.moduleSpecifier.text;

    if (!moduleFile.originalImports.includes(importPath)) {
      moduleFile.originalImports.push(importPath);
    }

    if (importPath === '@stencil/core/signals') {
      moduleFile.hasSignalsImport = true;
    }

    const localPath = resolveLocalImportPath(dirPath, importPath);
    if (localPath) {
      moduleFile.localImports.push(localPath);
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

/**
 * Record a local `export … from './x'` re-export as a local import, so build conditionals
 * propagate through barrel files. Bare-specifier re-exports are left alone.
 *
 * @param moduleFile the module containing the re-export
 * @param dirPath the module's (normalized) directory
 * @param exportNode the export declaration
 */
export const parseModuleReExport = (
  moduleFile: d.Module,
  dirPath: string,
  exportNode: ts.ExportDeclaration,
) => {
  if (exportNode.moduleSpecifier && ts.isStringLiteral(exportNode.moduleSpecifier)) {
    const localPath = resolveLocalImportPath(dirPath, exportNode.moduleSpecifier.text);
    if (localPath && !moduleFile.localImports.includes(localPath)) {
      moduleFile.localImports.push(localPath);
    }
  }
};

const resolveLocalImportPath = (dirPath: string, importPath: string) => {
  if (isAbsolute(importPath)) {
    return normalizePath(importPath);
  }
  if (importPath.startsWith('.')) {
    // `dirPath` is always an already-normalized, Stencil-absolute path (derived
    // from a source file's own fileName), so `join` is used here instead of
    // `resolve` - `resolve` falls through to native path.resolve() when given an
    // "absolute" path with no drive letter (as our normalized paths are on
    // Windows), which fills in process.cwd()'s real drive letter and corrupts
    // the path. `join` never touches process.cwd().
    return normalizePath(join(dirPath, importPath));
  }
  return undefined;
};
