import ts from 'typescript';

import type * as d from '../../../declarations';
import { addCreateEvents } from '../create-event';
import { updateConstructor } from '../transform-utils';
import { createNativeAttachInternalsBinding } from './attach-internals';

/**
 * Updates a constructor to include:
 * - a `super()` call
 * - function calls to initialize the component
 * - function calls to create custom event emitters
 * If a constructor does not exist, one will be created
 *
 * The constructor will be added to the provided list of {@link ts.ClassElement}s in place
 *
 * @param classMembers the class elements to modify
 * @param moduleFile the Stencil module representation of the component class
 * @param cmp the component metadata generated for the component
 * @param classNode the TypeScript syntax tree node for the class
 */
export const updateNativeConstructor = (
  classMembers: ts.ClassElement[],
  moduleFile: d.Module,
  cmp: d.ComponentCompilerMeta,
  classNode: ts.ClassDeclaration,
): void => {
  if (cmp.isPlain) {
    return;
  }

  const nativeCstrStatements: ts.Statement[] = [
    ...nativeInit(cmp),
    ...addCreateEvents(moduleFile, cmp),
    ...createNativeAttachInternalsBinding(cmp),
  ];
  updateConstructor(classNode, classMembers, nativeCstrStatements);
};

/**
 * Generates a series of expression statements used to help initialize a Stencil component
 * @param cmp the component's metadata
 * @returns the generated expression statements
 */
const nativeInit = (cmp: d.ComponentCompilerMeta): ReadonlyArray<ts.ExpressionStatement> => {
  const initStatements = [nativeRegisterHostStatement()];
  if (cmp.encapsulation === 'shadow') {
    initStatements.push(nativeAttachShadowStatement());
  }
  return initStatements;
};

/**
 * Generate an expression statement to register a host element with its VDOM equivalent in a global element-to-vdom
 * mapping.
 * @returns the generated expression statement
 */
const nativeRegisterHostStatement = (): ts.ExpressionStatement => {
  // Create an expression statement, `this.__registerHost();`
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(ts.factory.createThis(), ts.factory.createIdentifier('__registerHost')),
      undefined,
      undefined,
    ),
  );
};

/**
 * Generates an expression statement for attaching a shadow DOM tree to an element.
 * @returns the generated expression statement
 */
const nativeAttachShadowStatement = (): ts.ExpressionStatement => {
  // Create an expression statement, `this.__attachShadow();`
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(ts.factory.createThis(), ts.factory.createIdentifier('__attachShadow')),
      undefined,
      undefined,
    ),
  );
};
