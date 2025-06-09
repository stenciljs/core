import { normalizePath, resolve } from '@utils';
import { isAbsolute } from 'path';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { addExternalImport } from '../collections/add-external-import';

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

    if (isAbsolute(importPath)) {
      // absolute import
      importPath = normalizePath(importPath);
      moduleFile.localImports.push(importPath);
    } else if (importPath.startsWith('.')) {
      // relative import
      importPath = normalizePath(resolve(dirPath, importPath));
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
      );
    }
  }
};
