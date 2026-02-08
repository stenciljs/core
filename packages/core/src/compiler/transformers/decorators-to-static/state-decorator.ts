import ts from 'typescript';

import { convertValueToLiteral, createStaticGetter, retrieveTsDecorators, tsPropDeclName } from '../transform-utils';
import { isDecoratorNamed } from './decorator-utils';

/**
 * Convert class fields decorated with `@State` to static getters
 *
 * This function takes a list of decorated properties pulled off of a class
 * declaration AST Node and builds up equivalent static getter AST nodes
 * with which they can be replaced.
 *
 * @param decoratedProps TypeScript AST nodes representing class members
 * @param newMembers an out param containing new class members
 * @param typeChecker a reference to the TypeScript type checker
 * @param decoratorName the name of the decorator to look for
 */
export const stateDecoratorsToStatic = (
  decoratedProps: ts.ClassElement[],
  newMembers: ts.ClassElement[],
  typeChecker: ts.TypeChecker,
  decoratorName: string,
) => {
  const states = decoratedProps
    .filter(ts.isPropertyDeclaration)
    .map((prop) => stateDecoratorToStatic(prop, typeChecker, decoratorName))
    .filter((state): state is ts.PropertyAssignment => !!state);

  if (states.length > 0) {
    newMembers.push(createStaticGetter('states', ts.factory.createObjectLiteralExpression(states, true)));
  }
};

/**
 * Convert a property declaration decorated with `@State` to a property
 * assignment AST node which maps the name of the state property to an empty
 * object.
 *
 * Note that this function will return null if the property declaration is
 * decorated with other decorators.
 *
 * @param prop A TypeScript AST node representing a class property declaration
 * @param typeChecker a reference to the TypeScript type checker
 * @param decoratorName the name of the decorator to look for
 * @returns a property assignment AST Node which maps the name of the state
 * prop to an empty object
 */
const stateDecoratorToStatic = (
  prop: ts.PropertyDeclaration,
  typeChecker: ts.TypeChecker,
  decoratorName: string,
): ts.PropertyAssignment | null => {
  const stateDecorator = retrieveTsDecorators(prop)?.find(isDecoratorNamed(decoratorName));
  if (stateDecorator == null) {
    return null;
  }

  const { staticName: stateName, dynamicName: ogPropName } = tsPropDeclName(prop, typeChecker);
  const meta: any = {};
  if (ogPropName && ogPropName !== stateName) meta.ogPropName = ogPropName;

  return ts.factory.createPropertyAssignment(ts.factory.createStringLiteral(stateName), convertValueToLiteral(meta));
};
