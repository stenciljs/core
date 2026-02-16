import ts from 'typescript';

import type * as d from '../../declarations';
import { createImportStatement, createRequireStatement } from './transform-utils';

/**
 * Create a new import statement, and update the provided source file with the newly created statement.
 *
 * The generated import statement will be placed at the beginning of the source file.
 *
 * The generated import statement will be either a commonjs require statement or esm import statement, based on the
 * provided transform options.
 *
 * The import statement may include more than one named imports (identifiers) for the provided import path.
 *
 * @param transformOpts transform options configured for the current output target transpilation
 * @param tsSourceFile the TypeScript source file that is being updated
 * @param importFnNames a collection of named imports to add to the generated import statement
 * @param importPath the path to the module that the collection of named imports should be imported from
 * @returns the updated TypeScript source file
 */
export const addImports = (
  transformOpts: d.TransformOptions,
  tsSourceFile: ts.SourceFile,
  importFnNames: string[],
  importPath: string,
): ts.SourceFile => {
  if (importFnNames.length === 0) {
    return tsSourceFile;
  }

  if (transformOpts.module === 'cjs') {
    // CommonJS require()
    const newRequire = createRequireStatement(importFnNames, importPath);
    const statements = tsSourceFile.statements.slice();
    statements.splice(2, 0, newRequire);
    return ts.factory.updateSourceFile(tsSourceFile, statements);
  }

  // ESM Imports
  const newImport = createImportStatement(importFnNames, importPath);
  const statements = tsSourceFile.statements.slice();
  statements.unshift(newImport);
  return ts.factory.updateSourceFile(tsSourceFile, statements);
};
