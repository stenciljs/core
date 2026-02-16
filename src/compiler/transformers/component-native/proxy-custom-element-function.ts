import ts from 'typescript';

import type * as d from '../../../declarations';
import { createClassMetadataProxy } from '../add-component-meta-proxy';
import { addImports } from '../add-imports';
import { RUNTIME_APIS } from '../core-runtime-apis';
import { getModuleFromSourceFile } from '../transform-utils';

/**
 * Proxy custom elements for the `dist-custom-elements` output target. This function searches for a Stencil component's
 * class initializer (found on the right-hand side of the '=' operator):
 *
 * ```ts
 * const MyComponent = class extends HTMLElement { // Implementation omitted }
 * ```
 *
 * and wraps the initializer into a `proxyCustomElement` call:
 *
 * ```ts
 * const MyComponent = proxyCustomElement(class extends HTMLElement { // Implementation omitted }, componentMetadata);
 * ```
 *
 * This is to work around an issue where tree-shaking does not work for webpack users, whose details are captured in full
 * in [this issue on the webpack GitHub repo](https://github.com/webpack/webpack/issues/14963).
 *
 * @param compilerCtx current compiler context
 * @param transformOpts transpilation options for the current build
 * @returns a TypeScript AST transformer factory function that performs the above described transformation
 */
export const proxyCustomElement = (
  compilerCtx: d.CompilerCtx,
  transformOpts: d.TransformOptions,
): ts.TransformerFactory<ts.SourceFile> => {
  return () => {
    return (tsSourceFile: ts.SourceFile): ts.SourceFile => {
      const moduleFile = getModuleFromSourceFile(compilerCtx, tsSourceFile);
      if (!moduleFile.cmps.length) {
        return tsSourceFile;
      }

      const principalComponent = moduleFile.cmps[0];

      for (const [stmtIndex, stmt] of tsSourceFile.statements.entries()) {
        if (ts.isVariableStatement(stmt)) {
          for (const [declarationIndex, declaration] of stmt.declarationList.declarations.entries()) {
            if (declaration.name.getText() !== principalComponent.componentClassName) {
              continue;
            }

            // to narrow the type of `declaration.initializer` to `ts.ClassExpression`
            if (!ts.isClassExpression(declaration.initializer)) {
              continue;
            }

            const renamedClassExpression = ts.factory.updateClassExpression(
              declaration.initializer,
              ts.getModifiers(declaration.initializer),
              ts.factory.createIdentifier(principalComponent.componentClassName),
              declaration.initializer.typeParameters,
              declaration.initializer.heritageClauses,
              declaration.initializer.members,
            );

            // wrap the Stencil component's class declaration in a component proxy
            const proxyCreationCall = createClassMetadataProxy(principalComponent, renamedClassExpression);
            ts.addSyntheticLeadingComment(proxyCreationCall, ts.SyntaxKind.MultiLineCommentTrivia, '@__PURE__', false);

            // update the component's variable declaration to use the new initializer
            const proxiedComponentDeclaration = ts.factory.updateVariableDeclaration(
              declaration,
              declaration.name,
              declaration.exclamationToken,
              declaration.type,
              proxyCreationCall,
            );

            // update the declaration list that contains the updated variable declaration
            const updatedDeclarationList = ts.factory.updateVariableDeclarationList(stmt.declarationList, [
              ...stmt.declarationList.declarations.slice(0, declarationIndex),
              proxiedComponentDeclaration,
              ...stmt.declarationList.declarations.slice(declarationIndex + 1),
            ]);

            // update the variable statement containing the updated declaration list
            const updatedVariableStatement = ts.factory.updateVariableStatement(
              stmt,
              stmt.modifiers,
              updatedDeclarationList,
            );

            // update the source file's statements to use the new variable statement
            tsSourceFile = ts.factory.updateSourceFile(tsSourceFile, [
              ...tsSourceFile.statements.slice(0, stmtIndex),
              updatedVariableStatement,
              ...tsSourceFile.statements.slice(stmtIndex + 1),
            ]);

            // finally, ensure that the proxyCustomElement function is imported
            tsSourceFile = addImports(
              transformOpts,
              tsSourceFile,
              [RUNTIME_APIS.proxyCustomElement],
              transformOpts.coreImportPath,
            );

            return tsSourceFile;
          }
        }
      }
      return tsSourceFile;
    };
  };
};
