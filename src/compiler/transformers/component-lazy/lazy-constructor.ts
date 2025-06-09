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
    registerInstanceStatement(moduleFile),
    ...addCreateEvents(moduleFile, cmp),
    ...createLazyAttachInternalsBinding(cmp),
  ];

  updateConstructor(classNode, classMembers, cstrStatements, cstrMethodArgs);
};

/**
 * Create a statement containing an expression calling the `registerInstance`
 * helper with the {@link d.HostRef} argument passed to the lazy element
 * constructor
 *
 * **NOTE** this mutates the `moduleFile` param to add an import of the
 * `registerInstance` method from the Stencil core component runtime API.
 *
 * @param moduleFile information about a module containing a Stencil component
 * @returns an expression statement for a call to the `registerInstance` helper
 */
const registerInstanceStatement = (moduleFile: d.Module): ts.ExpressionStatement => {
  addCoreRuntimeApi(moduleFile, RUNTIME_APIS.registerInstance);

  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(ts.factory.createIdentifier(REGISTER_INSTANCE), undefined, [
      ts.factory.createThis(),
      ts.factory.createIdentifier(HOST_REF_ARG),
    ]),
  );
};
