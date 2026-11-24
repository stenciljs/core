import ts from 'typescript';

import type * as d from '../../../declarations';
import { addCoreRuntimeApi, REGISTER_INSTANCE, RUNTIME_APIS } from '../core-runtime-apis';
import { addCreateEvents } from '../create-event';
import { updateConstructor } from '../transform-utils';
import { createLazyAttachInternalsBinding } from './attach-internals';
import { HOST_REF_ARG } from './constants';

/**
 * Update the constructor for a Stencil component's class in order to prepare
 * it for lazy-build duty (i.e. to take over a bootstrapped component)
 *
 * @param classMembers an out param of class members for the component
 * @param classNode the class declaration of interest
 * @param moduleFile information about the component's home module
 * @param cmp compiler metadata about the component
 */
export const updateLazyComponentConstructor = (
  classMembers: ts.ClassElement[],
  classNode: ts.ClassDeclaration,
  moduleFile: d.Module,
  cmp: d.ComponentCompilerMeta,
) => {
  const cstrMethodArgs = [
    ts.factory.createParameterDeclaration(undefined, undefined, ts.factory.createIdentifier(HOST_REF_ARG)),
  ];

  const cstrStatements = [
    registerInstanceStatement(moduleFile, classNode),
    ...addCreateEvents(moduleFile, cmp),
    ...createLazyAttachInternalsBinding(cmp),
  ];

  updateConstructor(classNode, classMembers, cstrStatements, cstrMethodArgs);
};

/**
 * Create a statement containing an expression calling the `registerInstance`
 * helper with the {@link d.HostRef} argument passed to the lazy element
 * constructor.
 *
 * The call is guarded by `new.target === <ClassName>` so only the
 * most-derived component class registers the instance. A base component's
 * constructor runs (via `super()`) before the derived class's field
 * initializers, so registering there would wire up props and state before the
 * derived class has applied its own defaults.
 *
 * **NOTE** this mutates the `moduleFile` param to add an import of the
 * `registerInstance` method from the Stencil core component runtime API.
 *
 * @param moduleFile information about a module containing a Stencil component
 * @param classNode the class declaration of the component
 * @returns a statement calling the `registerInstance` helper
 */
const registerInstanceStatement = (moduleFile: d.Module, classNode: ts.ClassDeclaration) => {
  addCoreRuntimeApi(moduleFile, RUNTIME_APIS.registerInstance);

  const registerCall = ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(ts.factory.createIdentifier(REGISTER_INSTANCE), undefined, [
      ts.factory.createThis(),
      ts.factory.createIdentifier(HOST_REF_ARG),
    ]),
  );

  if (!classNode.name) {
    return registerCall;
  }

  return ts.factory.createIfStatement(
    ts.factory.createStrictEquality(
      ts.factory.createMetaProperty(ts.SyntaxKind.NewKeyword, ts.factory.createIdentifier('target')),
      ts.factory.createIdentifier(classNode.name.text),
    ),
    registerCall,
  );
};
