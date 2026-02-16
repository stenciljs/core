import { formatComponentRuntimeMeta } from '@utils';
import ts from 'typescript';

import type * as d from '../../declarations';
import { addCoreRuntimeApi, PROXY_CUSTOM_ELEMENT, RUNTIME_APIS } from './core-runtime-apis';
import { convertValueToLiteral } from './transform-utils';

export const addModuleMetadataProxies = (tsSourceFile: ts.SourceFile, moduleFile: d.Module) => {
  const statements = tsSourceFile.statements.slice();

  addCoreRuntimeApi(moduleFile, RUNTIME_APIS.proxyCustomElement);

  statements.push(...moduleFile.cmps.map(createComponentMetadataProxy));

  return ts.factory.updateSourceFile(tsSourceFile, statements);
};

/**
 * Create a call expression for wrapping a component in a proxy. This call expression takes a form:
 * ```ts
 * PROXY_CUSTOM_ELEMENT(ComponentClassName, Metadata);
 * ```
 * where
 * - `PROXY_CUSTOM_ELEMENT` is a Stencil internal identifier that will be replaced with the name of the actual function
 * name at compile time
 * - `ComponentClassName` is the name Stencil component's class
 * - `Metadata` is the compiler metadata associated with the Stencil component
 *
 * @param compilerMeta compiler metadata associated with the component to be wrapped in a proxy
 * @returns the generated call expression
 */
const createComponentMetadataProxy = (compilerMeta: d.ComponentCompilerMeta): ts.ExpressionStatement => {
  const compactMeta: d.ComponentRuntimeMetaCompact = formatComponentRuntimeMeta(compilerMeta, true);

  const literalCmpClassName = ts.factory.createIdentifier(compilerMeta.componentClassName);
  const literalMeta = convertValueToLiteral(compactMeta);

  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createIdentifier(PROXY_CUSTOM_ELEMENT),
      [],
      [literalCmpClassName, literalMeta],
    ),
  );
};

/**
 * Create a call expression for wrapping a component represented as a class
 * expression in a proxy. This call expression takes the form:
 *
 * ```ts
 * PROXY_CUSTOM_ELEMENT(Clazz, Metadata);
 * ```
 *
 * where
 * - `PROXY_CUSTOM_ELEMENT` is a Stencil internal identifier that will be
 *   replaced with the name of the actual function name at compile time
 * - `Clazz` is a class expression to be proxied
 * - `Metadata` is the compiler metadata associated with the Stencil component
 *
 * @param compilerMeta compiler metadata associated with the component to be
 * wrapped in a proxy
 * @param clazz the class expression to proxy
 * @returns the generated call expression
 */
export const createClassMetadataProxy = (
  compilerMeta: d.ComponentCompilerMeta,
  clazz: ts.ClassExpression,
): ts.CallExpression => {
  const compactMeta: d.ComponentRuntimeMetaCompact = formatComponentRuntimeMeta(compilerMeta, true);
  const literalMeta = convertValueToLiteral(compactMeta);

  return ts.factory.createCallExpression(ts.factory.createIdentifier(PROXY_CUSTOM_ELEMENT), [], [clazz, literalMeta]);
};
