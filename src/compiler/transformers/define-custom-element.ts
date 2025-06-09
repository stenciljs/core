import { formatComponentRuntimeMeta } from '@utils';
import ts from 'typescript';

import type * as d from '../../declarations';
import { addCoreRuntimeApi, DEFINE_CUSTOM_ELEMENT, RUNTIME_APIS } from './core-runtime-apis';
import { convertValueToLiteral } from './transform-utils';

export const defineCustomElement = (
  tsSourceFile: ts.SourceFile,
  moduleFile: d.Module,
  transformOpts: d.TransformOptions,
) => {
  let statements = tsSourceFile.statements.slice();

  statements.push(
    ...moduleFile.cmps.map((cmp) => {
      return addDefineCustomElement(moduleFile, cmp);
    }),
  );

  if (transformOpts.module === 'cjs') {
    // remove commonjs exports keyword from component classes
    statements = removeComponentCjsExport(statements, moduleFile);
  }

  return ts.factory.updateSourceFile(tsSourceFile, statements);
};

const addDefineCustomElement = (moduleFile: d.Module, compilerMeta: d.ComponentCompilerMeta) => {
  if (compilerMeta.isPlain) {
    // add customElements.define('cmp-a', CmpClass);
    return ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier('customElements'),
          ts.factory.createIdentifier('define'),
        ),
        [],
        [
          ts.factory.createStringLiteral(compilerMeta.tagName),
          ts.factory.createIdentifier(compilerMeta.componentClassName),
        ],
      ),
    );
  }

  addCoreRuntimeApi(moduleFile, RUNTIME_APIS.defineCustomElement);
  const compactMeta: d.ComponentRuntimeMetaCompact = formatComponentRuntimeMeta(compilerMeta, true);

  const liternalCmpClassName = ts.factory.createIdentifier(compilerMeta.componentClassName);
  const liternalMeta = convertValueToLiteral(compactMeta);

  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createIdentifier(DEFINE_CUSTOM_ELEMENT),
      [],
      [liternalCmpClassName, liternalMeta],
    ),
  );
};

const removeComponentCjsExport = (statements: ts.Statement[], moduleFile: d.Module) => {
  const cmpClassNames = new Set<string>(moduleFile.cmps.map((cmp) => cmp.componentClassName));

  return statements.filter((s) => {
    if (s.kind === ts.SyntaxKind.ExpressionStatement) {
      const exp = (s as ts.ExpressionStatement).expression as ts.BinaryExpression;
      if (exp && exp.kind === ts.SyntaxKind.BinaryExpression) {
        const left = exp.left as ts.PropertyAccessExpression;
        if (left && left.kind === ts.SyntaxKind.PropertyAccessExpression) {
          if (left.expression && left.expression.kind === ts.SyntaxKind.Identifier) {
            const leftText = left.expression as ts.Identifier;
            if (leftText.text === 'exports') {
              const right = exp.right as ts.Identifier;
              if (right && cmpClassNames.has(right.text)) {
                return false;
              }
            }
          }
        }
      }
    }
    return true;
  });
};
