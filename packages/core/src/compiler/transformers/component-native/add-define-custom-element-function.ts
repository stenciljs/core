import ts from 'typescript';
import type * as d from '@stencil/core';

import { dashToPascalCase } from '../../../utils';
import { addCoreRuntimeApi, GET_REGISTRY, RUNTIME_APIS, TRANSFORM_TAG } from '../core-runtime-apis';
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
        addCoreRuntimeApi(moduleFile, RUNTIME_APIS.getRegistry);

        const principalComponent = moduleFile.cmps[0];
        tagNames.push(principalComponent.tagName);

        caseStatements.push(
          createDefineCase(
            principalComponent.tagName,
            createScopedDefineExpression(principalComponent.componentClassName),
          ),
        );

        setupComponentDependencies(moduleFile, components, newStatements, caseStatements, tagNames);
        addDefineCustomElementFunction(tagNames, newStatements, caseStatements);

        if (outputTarget.customElementsExportBehavior === 'auto-define-custom-elements') {
          newStatements.push(createAutoDefinitionExpression());
        }

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
 * Creates `(ComponentClass._registry = _reg, _reg.define(transformTag(tagName), ComponentClass))`.
 * The comma expression lets both the _registry stamp and the define call fit inside the single
 * if-body block that createDefineCase wraps around the action expression.
 * @param componentClassName the component class identifier name
 * @returns a TS comma-list expression for the scoped-registry define
 */
const createScopedDefineExpression = (componentClassName: string): ts.Expression =>
  ts.factory.createCommaListExpression([
    ts.factory.createAssignment(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(componentClassName),
        '_registry',
      ),
      ts.factory.createIdentifier('_reg'),
    ),
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('_reg'), 'define'),
      undefined,
      [
        ts.factory.createCallExpression(
          ts.factory.createIdentifier(TRANSFORM_TAG),
          [],
          [ts.factory.createIdentifier('tagName')],
        ),
        ts.factory.createIdentifier(componentClassName),
      ],
    ),
  ]);

/**
 * Adds dependent component imports and case blocks for all transitive dependencies.
 * @param moduleFile current component's module
 * @param components all components in the build
 * @param newStatements top-level statement array to append imports to
 * @param caseStatements switch case array to append dependency cases to
 * @param tagNames tag name list to append dependency tag names to
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

      newStatements.push(
        createImportStatement([`defineCustomElement as ${importAs}`], foundDep.sourceFilePath),
      );

      // Delegate to the dep's own defineCustomElement, threading opts so it resolves the same registry.
      const callExpression = ts.factory.createCallExpression(
        ts.factory.createIdentifier(importAs),
        undefined,
        [ts.factory.createIdentifier('opts')],
      );
      caseStatements.push(createDefineCase(foundDep.tagName, callExpression));
    });
  });
};

/**
 * Creates a switch case that guards the action behind a registry.get() check.
 *
 * @param tagName the component's original tag name (before transformation)
 * @param actionExpression the define or delegate call expression
 * @returns a TS CaseClause for the switch statement
 */
const createDefineCase = (tagName: string, actionExpression: ts.Expression): ts.CaseClause => {
  const registryIdent = ts.factory.createIdentifier('_reg');

  const getCheck = ts.factory.createPrefixUnaryExpression(
    ts.SyntaxKind.ExclamationToken,
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(registryIdent, 'get'),
      undefined,
      [
        ts.factory.createCallExpression(
          ts.factory.createIdentifier(TRANSFORM_TAG),
          [],
          [ts.factory.createIdentifier('tagName')],
        ),
      ],
    ),
  );

  return ts.factory.createCaseClause(ts.factory.createStringLiteral(tagName), [
    ts.factory.createIfStatement(
      getCheck,
      ts.factory.createBlock([ts.factory.createExpressionStatement(actionExpression)]),
    ),
    ts.factory.createBreakStatement(),
  ]);
};

/**
 * Adds the exported `defineCustomElement` function declaration.
 *
 * Global path:
 * ```js
 * export function defineCustomElement() {
 *   if (typeof customElements === 'undefined') return;
 *   ['my-comp', ...].forEach(tagName => { switch (tagName) { ... } });
 * }
 * ```
 *
 * Scoped path:
 * ```js
 * export function defineCustomElement(opts) {
 *   const _storeReg = __stencil_getRegistry();
 *   const _reg = opts?.registry ?? _storeReg;
 *   if (typeof _reg === 'undefined') return;
 *   ['my-comp', ...].forEach(tagName => { switch (tagName) { ... } });
 * }
 * ```
 */
/**
 * @param tagNames all tag names (principal + dependencies) to include in the forEach
 * @param newStatements top-level statement array to append the function declaration to
 * @param caseStatements switch case clauses to embed in the forEach body
 */
const addDefineCustomElementFunction = (
  tagNames: string[],
  newStatements: ts.Statement[],
  caseStatements: ts.CaseClause[],
) => {
  const forEachStmt = buildForEachStatement(tagNames, caseStatements);

  const bodyStatements: ts.Statement[] = [
    // const _storeReg = __stencil_getRegistry();
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            '_storeReg',
            undefined,
            undefined,
            ts.factory.createCallExpression(
              ts.factory.createIdentifier(GET_REGISTRY),
              undefined,
              [],
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    ),
    // const _reg = opts?.registry ?? _storeReg;
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            '_reg',
            undefined,
            undefined,
            ts.factory.createBinaryExpression(
              ts.factory.createPropertyAccessChain(
                ts.factory.createIdentifier('opts'),
                ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
                ts.factory.createIdentifier('registry'),
              ),
              ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
              ts.factory.createIdentifier('_storeReg'),
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    ),
    // if (typeof _reg === 'undefined') return;
    ts.factory.createIfStatement(
      ts.factory.createStrictEquality(
        ts.factory.createTypeOfExpression(ts.factory.createIdentifier('_reg')),
        ts.factory.createStringLiteral('undefined'),
      ),
      ts.factory.createBlock([ts.factory.createReturnStatement()]),
    ),
    forEachStmt,
  ];

  const params = [
    ts.factory.createParameterDeclaration(
      undefined,
      undefined,
      'opts',
      ts.factory.createToken(ts.SyntaxKind.QuestionToken),
    ),
  ];

  newStatements.push(
    ts.factory.createFunctionDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      undefined,
      ts.factory.createIdentifier('defineCustomElement'),
      undefined,
      params,
      undefined,
      ts.factory.createBlock(bodyStatements, true),
    ),
  );
};

/**
 * Builds `['tag1', 'tag2'].forEach(tagName => { switch (tagName) { ... } })`.
 * Inlining the array literal avoids a separate `const components` statement.
 * @param tagNames tag names to iterate over
 * @param caseStatements switch cases to embed in the arrow function body
 * @returns a TS expression statement for the forEach call
 */
const buildForEachStatement = (tagNames: string[], caseStatements: ts.CaseClause[]): ts.Statement =>
  ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createArrayLiteralExpression(
          tagNames.map((t) => ts.factory.createStringLiteral(t)),
        ),
        'forEach',
      ),
      undefined,
      [
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [ts.factory.createParameterDeclaration(undefined, undefined, 'tagName')],
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
  );

/**
 * Creates `defineCustomElement(MyPrincipalComponent)` for auto-define-custom-elements behavior.
 * @param componentName the component class identifier name
 * @returns the expression statement calling defineCustomElement
 */
function createAutoDefinitionExpression(): ts.ExpressionStatement {
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createIdentifier('defineCustomElement'),
      undefined,
      [],
    ),
  );
}
