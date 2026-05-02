import ts from 'typescript';
import type * as d from '@stencil/core';

import { dashToPascalCase } from '../../../utils';
import { addCoreRuntimeApi, RUNTIME_APIS, TRANSFORM_TAG } from '../core-runtime-apis';
import { createImportStatement, getModuleFromSourceFile } from '../transform-utils';

/**
 * Import and define components along with any component dependents within the `standalone` output.
 * Adds `defineCustomElement()` function for all components.
 * @param compilerCtx - current compiler context
 * @param components - all current components within the stencil buildCtx
 * @param outputTarget - the output target being compiled
 * @param devMode - whether this is a dev build (injects __stencil_module__ for HMR)
 * @returns a TS AST transformer factory function
 */
export const addDefineCustomElementFunctions = (
  compilerCtx: d.CompilerCtx,
  components: d.ComponentCompilerMeta[],
  outputTarget: d.OutputTargetStandalone,
  devMode: boolean,
): ts.TransformerFactory<ts.SourceFile> => {
  return () => {
    return (tsSourceFile: ts.SourceFile): ts.SourceFile => {
      const moduleFile = getModuleFromSourceFile(compilerCtx, tsSourceFile);
      const newStatements: ts.Statement[] = [];
      const caseStatements: ts.CaseClause[] = [];
      const tagNames: string[] = [];

      if (moduleFile.cmps.length) {
        addCoreRuntimeApi(moduleFile, RUNTIME_APIS.transformTag);

        const principalComponent = moduleFile.cmps[0];
        tagNames.push(principalComponent.tagName);

        // define the current component - `customElements.define(transformTag(tagName), MyProxiedComponent);`
        const customElementsDefineCallExpression = ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('customElements'),
            'define',
          ),
          undefined,
          [
            ts.factory.createCallExpression(
              ts.factory.createIdentifier(TRANSFORM_TAG),
              [],
              [ts.factory.createIdentifier('tagName')],
            ),
            ts.factory.createIdentifier(principalComponent.componentClassName),
          ],
        );
        // create a `case` block that defines the current component. We'll add them to our switch statement later.
        caseStatements.push(
          createCustomElementsDefineCase(
            principalComponent.tagName,
            customElementsDefineCallExpression,
          ),
        );

        setupComponentDependencies(moduleFile, components, newStatements, caseStatements, tagNames);
        addDefineCustomElementFunction(tagNames, newStatements, caseStatements);

        if (outputTarget.customElementsExportBehavior === 'auto-define-custom-elements') {
          const conditionalDefineCustomElementCall = createAutoDefinitionExpression(
            principalComponent.componentClassName,
          );
          newStatements.push(conditionalDefineCustomElementCall);
        }

        // In dev builds, stamp each component class with its own module URL so the
        // HMR runtime can re-import the exact file that needs to be replaced.
        // Emits: MyComponent.__stencil_module__ = import.meta.url;
        if (devMode) {
          newStatements.push(
            ts.factory.createExpressionStatement(
              ts.factory.createAssignment(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier(principalComponent.componentClassName),
                  '__stencil_module__',
                ),
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createMetaProperty(
                    ts.SyntaxKind.ImportKeyword,
                    ts.factory.createIdentifier('meta'),
                  ),
                  ts.factory.createIdentifier('url'),
                ),
              ),
            ),
          );
        }
      }

      tsSourceFile = ts.factory.updateSourceFile(tsSourceFile, [
        ...tsSourceFile.statements,
        ...newStatements,
      ]);

      return tsSourceFile;
    };
  };
};

/**
 * Adds dependent component import statements and sets up and case blocks
 * @param moduleFile current components' module
 * @param components all current components within the stencil buildCtx
 * @param newStatements new top level statement array to add to that will get added to the AST
 * @param caseStatements an array of case statement blocks to add to. Will get added to `defineCustomElement` later
 * @param tagNames array of all related component tag-names to add to
 */
const setupComponentDependencies = (
  moduleFile: d.Module,
  components: d.ComponentCompilerMeta[],
  newStatements: ts.Statement[],
  caseStatements: ts.CaseClause[],
  tagNames: string[],
) => {
  moduleFile.cmps.forEach((cmp) => {
    cmp.dependencies.forEach((dCmp) => {
      const foundDep = components.find((dComp) => dComp.tagName === dCmp);
      const exportName = dashToPascalCase(foundDep.tagName);
      const importAs = `$${exportName}DefineCustomElement`;
      tagNames.push(foundDep.tagName);

      // Will add `import { defineCustomElement as $ComponentDefineCustomElement } from 'my-nested-component.tsx';`
      newStatements.push(
        createImportStatement([`defineCustomElement as ${importAs}`], foundDep.sourceFilePath),
      );

      // define a dependent component by recursively calling their own `defineCustomElement()`
      const callExpression = ts.factory.createCallExpression(
        ts.factory.createIdentifier(importAs),
        undefined,
        [],
      );
      // `case` blocks that define the dependent components. We'll add them to our switch statement later.
      caseStatements.push(createCustomElementsDefineCase(foundDep.tagName, callExpression));
    });
  });
};

/**
 * Creates a case block which will be used to define components. e.g.
 * ``` javascript
 * case "my-component":
 *   if (!customElements.get(transformTag(tagName))) {
 *     customElements.define(transformTag(tagName), MyProxiedComponent);
 *     // OR for dependent components
 *     defineCustomElement(tagName);
 *   }
 *   break;
 * } });
  ```
 * @param tagName the components' tagName saved within stencil.
 * @param actionExpression the actual expression to call to define the customElement
 * @returns ts AST CaseClause
 */
const createCustomElementsDefineCase = (
  tagName: string,
  actionExpression: ts.Expression,
): ts.CaseClause => {
  return ts.factory.createCaseClause(ts.factory.createStringLiteral(tagName), [
    ts.factory.createIfStatement(
      ts.factory.createPrefixUnaryExpression(
        ts.SyntaxKind.ExclamationToken,
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('customElements'),
            'get',
          ),
          undefined,
          [
            ts.factory.createCallExpression(
              ts.factory.createIdentifier(TRANSFORM_TAG),
              [],
              [ts.factory.createIdentifier('tagName')],
            ),
          ],
        ),
      ),
      ts.factory.createBlock([ts.factory.createExpressionStatement(actionExpression)]),
    ),
    ts.factory.createBreakStatement(),
  ]);
};

/**
 * Add the main `defineCustomElement` function e.g.
 * ```javascript
 * function defineCustomElement() {
 *  if (typeof customElements === 'undefined') {
 *    return;
 *  }
 *  const components = ['my-component'];
 *   components.forEach(tagName => {
 *     switch (tagName) {
 *       case "my-component":
 *         if (!customElements.get(transformTag(tagName))) {
 *           customElements.define(transformTag(tagName), MyProxiedComponent);
 *           // OR for dependent components
 *           defineCustomElement(tagName);
 *         }
 *         break;
 *     }
 *   });
 * }
 ```
 * @param tagNames all components that will be defined
 * @param newStatements new top level statement array that will get added to the AST
 * @param caseStatements an array of case statement blocks. Will get added to `defineCustomElement` later
 */
const addDefineCustomElementFunction = (
  tagNames: string[],
  newStatements: ts.Statement[],
  caseStatements: ts.CaseClause[],
) => {
  const newExpression = ts.factory.createFunctionDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    undefined,
    ts.factory.createIdentifier('defineCustomElement'),
    undefined,
    [],
    undefined,
    ts.factory.createBlock(
      [
        ts.factory.createIfStatement(
          ts.factory.createStrictEquality(
            ts.factory.createTypeOfExpression(ts.factory.createIdentifier('customElements')),
            ts.factory.createStringLiteral('undefined'),
          ),
          ts.factory.createBlock([ts.factory.createReturnStatement()]),
        ),
        ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                'components',
                undefined,
                undefined,
                ts.factory.createArrayLiteralExpression(
                  tagNames.map((tagName) => ts.factory.createStringLiteral(tagName)),
                ),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        ),
        ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier('components'),
              'forEach',
            ),
            undefined,
            [
              ts.factory.createArrowFunction(
                undefined,
                undefined,
                [
                  ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    ts.factory.createIdentifier('tagName'),
                    undefined,
                    undefined,
                  ),
                ],
                undefined,
                ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                ts.factory.createBlock([
                  ts.factory.createSwitchStatement(
                    ts.factory.createIdentifier('tagName'),
                    ts.factory.createCaseBlock(caseStatements),
                  ),
                ]),
              ),
            ],
          ),
        ),
      ],
      true,
    ),
  );
  newStatements.push(newExpression);
};

/**
 * Create a call to `defineCustomElement` for the principle web component.
 * ```typescript
 * defineCustomElement(MyPrincipalComponent);
 * ```
 * @param componentName the component's class name to use as the first argument to `defineCustomElement`
 * @returns the expression statement described above
 */
function createAutoDefinitionExpression(componentName: string): ts.ExpressionStatement {
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(ts.factory.createIdentifier('defineCustomElement'), undefined, [
      ts.factory.createIdentifier(componentName),
    ]),
  );
}
