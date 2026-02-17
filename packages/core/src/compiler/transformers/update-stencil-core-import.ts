import ts from 'typescript';

import { STENCIL_CORE_ID, STENCIL_JSX_DEV_RUNTIME_ID, STENCIL_JSX_RUNTIME_ID } from '../bundle/entry-alias-ids';

export const updateStencilCoreImports = (updatedCoreImportPath: string): ts.TransformerFactory<ts.SourceFile> => {
  return () => {
    return (tsSourceFile) => {
      if (STENCIL_CORE_ID === updatedCoreImportPath) {
        return tsSourceFile;
      }

      let madeChanges = false;
      const newStatements: ts.Statement[] = [];

      tsSourceFile.statements.forEach((s) => {
        if (ts.isImportDeclaration(s)) {
          if (s.moduleSpecifier != null && ts.isStringLiteral(s.moduleSpecifier)) {
            const moduleSpecifierText = s.moduleSpecifier.text;

            // Handle @stencil/core/jsx-runtime and @stencil/core/jsx-dev-runtime imports
            if (moduleSpecifierText === STENCIL_JSX_RUNTIME_ID || moduleSpecifierText === STENCIL_JSX_DEV_RUNTIME_ID) {
              // Rewrite to import from the updated core import path
              const newImport = ts.factory.updateImportDeclaration(
                s,
                s.modifiers,
                s.importClause,
                ts.factory.createStringLiteral(updatedCoreImportPath),
                s.attributes,
              );
              newStatements.push(newImport);
              madeChanges = true;
              return;
            }

            if (moduleSpecifierText === STENCIL_CORE_ID) {
              if (
                s.importClause &&
                s.importClause.namedBindings &&
                s.importClause.namedBindings.kind === ts.SyntaxKind.NamedImports
              ) {
                const origImports = s.importClause.namedBindings.elements;

                const keepImports = origImports.map((e) => e.getText()).filter((name) => KEEP_IMPORTS.has(name));

                if (keepImports.length > 0) {
                  const newImport = ts.factory.updateImportDeclaration(
                    s,
                    undefined,
                    ts.factory.createImportClause(
                      false,
                      undefined,
                      ts.factory.createNamedImports(
                        keepImports.map((name) =>
                          ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name)),
                        ),
                      ),
                    ),
                    ts.factory.createStringLiteral(updatedCoreImportPath),
                    undefined,
                  );
                  newStatements.push(newImport);
                }
              }
              madeChanges = true;
              return;
            }
          }
        }
        newStatements.push(s);
      });

      if (madeChanges) {
        return ts.factory.updateSourceFile(
          tsSourceFile,
          newStatements,
          tsSourceFile.isDeclarationFile,
          tsSourceFile.referencedFiles,
          tsSourceFile.typeReferenceDirectives,
          tsSourceFile.hasNoDefaultLib,
          tsSourceFile.libReferenceDirectives,
        );
      }

      return tsSourceFile;
    };
  };
};

/**
 * A set of imports which we don't want to remove from an output file
 */
const KEEP_IMPORTS = new Set([
  'h',
  'setMode',
  'getMode',
  'setPlatformHelpers',
  'Build',
  'Env',
  'Host',
  'Fragment',
  'getAssetPath',
  'writeTask',
  'readTask',
  'getElement',
  'forceUpdate',
  'getRenderingRef',
  'forceModeUpdate',
  'setErrorHandler',
  'setTagTransformer',
  'transformTag',
  'Mixin',
  'jsx',
  'jsxs',
  'jsxDEV',
]);
