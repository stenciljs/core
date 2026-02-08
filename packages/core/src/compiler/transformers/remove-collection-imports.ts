import ts from 'typescript';

import type * as d from '../../declarations';

export const removeCollectionImports = (compilerCtx: d.CompilerCtx): ts.TransformerFactory<ts.SourceFile> => {
  /*
    // remove side effect collection imports like:
    import 'ionicons';

    // do not remove collection imports with importClauses:
    import * as asdf 'ionicons';
    import { asdf } '@ionic/core';
  */
  return () => {
    return (tsSourceFile) => {
      let madeUpdates = false;
      const statements = tsSourceFile.statements.slice();

      for (let i = statements.length - 1; i >= 0; i--) {
        const n = statements[i];
        if (ts.isImportDeclaration(n)) {
          if (!n.importClause && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) {
            // must not have an import clause
            // must have a module specifier and
            // the module specifier must be a string literal
            const importPath = n.moduleSpecifier.text;

            // test if this side effect import is a collection
            const isCollectionImport = compilerCtx.collections.some((c) => {
              return c.collectionName === importPath || c.moduleId === importPath;
            });

            if (isCollectionImport) {
              // turns out this is a side effect import is a collection,
              // we actually don't want to include this in the JS output
              // we've already gathered the types we needed, kthxbai
              madeUpdates = true;
              statements.splice(i, 1);
            }
          }
        }
      }

      if (madeUpdates) {
        return ts.factory.updateSourceFile(tsSourceFile, statements);
      }
      return tsSourceFile;
    };
  };
};
