import ts from 'typescript';

import {
  STENCIL_CORE_ID,
  STENCIL_JSX_DEV_RUNTIME_ID,
  STENCIL_JSX_RUNTIME_ID,
} from '../bundle/entry-alias-ids';

export const updateStencilCoreImports = (
  updatedCoreImportPath: string,
): ts.TransformerFactory<ts.SourceFile> => {
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
            if (
              moduleSpecifierText === STENCIL_JSX_RUNTIME_ID ||
              moduleSpecifierText === STENCIL_JSX_DEV_RUNTIME_ID
            ) {
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

                // by the imported name, keeping any alias (`Build as B`); `getText()` would fail on
                // an import a transformer added
                const keepImports = origImports.filter((e) =>
                  KEEP_IMPORTS.has((e.propertyName ?? e.name).text),
                );

                if (keepImports.length > 0) {
                  const newImport = ts.factory.updateImportDeclaration(
                    s,
                    undefined,
                    ts.factory.createImportClause(
                      false,
                      undefined,
                      ts.factory.createNamedImports(
                        keepImports.map((e) =>
                          ts.factory.createImportSpecifier(
                            false,
                            e.propertyName
                              ? ts.factory.createIdentifier(e.propertyName.text)
                              : undefined,
                            ts.factory.createIdentifier(e.name.text),
                          ),
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
  'Build',
  'Env',
  'Fragment',
  'Host',
  'Mixin',
  'ReactiveControllerHost',
  'forceUpdate',
  'forceModeUpdate',
  'getAssetPath',
  'getElement',
  'getMode',
  'getRenderingRef',
  'getShadowRoot',
  'h',
  'jsx',
  'jsxs',
  'readTask',
  'render',
  'setErrorHandler',
  'setMode',
  'setPlatformHelpers',
  'setTagTransformer',
  'transformTag',
  'writeTask',
]);
