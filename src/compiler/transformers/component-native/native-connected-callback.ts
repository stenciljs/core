import ts from 'typescript';

import type * as d from '../../../declarations';

/**
 * Add or update a `connectedCallback` method for a Stencil component
 *
 * *Note*: This function will mutate either the `classMembers` parameter or
 * one of its members.
 *
 * @param classMembers the members on the component's class
 * @param cmp metadata about the component
 */
export const addNativeConnectedCallback = (classMembers: ts.ClassElement[], cmp: d.ComponentCompilerMeta) => {
  // function call to stencil's exported connectedCallback(elm, plt)

  // TODO: fast path
  if (cmp.isPlain && cmp.hasRenderFn) {
    const fnCall = ts.factory.createExpressionStatement(
      ts.factory.createAssignment(
        ts.factory.createPropertyAccessExpression(ts.factory.createThis(), 'textContent'),
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(ts.factory.createThis(), 'render'),
          undefined,
          undefined,
        ),
      ),
    );
    const connectedCallback = classMembers.find((classMember) => {
      return ts.isMethodDeclaration(classMember) && (classMember.name as any).escapedText === CONNECTED_CALLBACK;
    }) as ts.MethodDeclaration;

    if (connectedCallback != null) {
      // class already has a connectedCallback(), so update it
      const callbackMethod = ts.factory.createMethodDeclaration(
        undefined,
        undefined,
        CONNECTED_CALLBACK,
        undefined,
        undefined,
        [],
        undefined,
        ts.factory.createBlock([fnCall, ...connectedCallback.body.statements], true),
      );
      const index = classMembers.indexOf(connectedCallback);
      classMembers[index] = callbackMethod;
    } else {
      // class doesn't have a connectedCallback(), so add it
      const callbackMethod = ts.factory.createMethodDeclaration(
        undefined,
        undefined,
        CONNECTED_CALLBACK,
        undefined,
        undefined,
        [],
        undefined,
        ts.factory.createBlock([fnCall], true),
      );
      classMembers.push(callbackMethod);
    }
  }
};

const CONNECTED_CALLBACK = 'connectedCallback';
