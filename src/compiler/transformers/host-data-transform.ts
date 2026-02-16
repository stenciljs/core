import ts from 'typescript';

import type * as d from '../../declarations';
import { addCoreRuntimeApi, H, HOST, RUNTIME_APIS } from './core-runtime-apis';
import { retrieveModifierLike } from './transform-utils';

export const transformHostData = (classElements: ts.ClassElement[], moduleFile: d.Module) => {
  const hasHostData = classElements.some(
    (e) => ts.isMethodDeclaration(e) && (e.name as any).escapedText === 'hostData',
  );
  if (hasHostData) {
    const renderIndex = classElements.findIndex(
      (e) => ts.isMethodDeclaration(e) && (e.name as any).escapedText === 'render',
    );
    if (renderIndex >= 0) {
      const renderMethod = classElements[renderIndex] as ts.MethodDeclaration;
      classElements[renderIndex] = ts.factory.updateMethodDeclaration(
        renderMethod,
        retrieveModifierLike(renderMethod),
        renderMethod.asteriskToken,
        ts.factory.createIdentifier(INTERNAL_RENDER),
        renderMethod.questionToken,
        renderMethod.typeParameters,
        renderMethod.parameters,
        renderMethod.type,
        renderMethod.body,
      );
    }
    classElements.push(syntheticRender(moduleFile, renderIndex >= 0));
  }
};

const syntheticRender = (moduleFile: d.Module, hasRender: boolean) => {
  addCoreRuntimeApi(moduleFile, RUNTIME_APIS.Host);
  addCoreRuntimeApi(moduleFile, RUNTIME_APIS.h);

  const hArguments = [
    // __stencil_Host
    ts.factory.createIdentifier(HOST),
    // this.hostData()
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(ts.factory.createThis(), 'hostData'),
      undefined,
      undefined,
    ),
  ];
  if (hasRender) {
    hArguments.push(
      // this.render()
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(ts.factory.createThis(), INTERNAL_RENDER),
        undefined,
        undefined,
      ),
    );
  }

  /**
   * render() {
   *   return h(arguments);
   * }
   */
  return ts.factory.createMethodDeclaration(
    undefined,
    undefined,
    'render',
    undefined,
    undefined,
    [],
    undefined,
    ts.factory.createBlock([
      ts.factory.createReturnStatement(
        ts.factory.createCallExpression(ts.factory.createIdentifier(H), undefined, hArguments),
      ),
    ]),
  );
};

const INTERNAL_RENDER = '__stencil_render';
