import { buildError } from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { convertValueToLiteral, createStaticGetter, retrieveTsDecorators, tsPropDeclName } from '../transform-utils';
import { isDecoratorNamed } from './decorator-utils';

/**
 * Convert the attach internals decorator to static, saving the name of the
 * decorated property so an `ElementInternals` object can be bound to it later
 * on.
 *
 * The `@AttachInternals` decorator is used to indicate a field on a class
 * where the return value of the `HTMLElement.attachInternals` method should be
 * bound. This then allows component authors to use that interface to make their
 * Stencil components rich participants in whatever `HTMLFormElement` instances
 * they find themselves inside of in the future.
 *
 * The decorator also accepts an optional `states` option to define initial
 * custom states that will be set on the `ElementInternals.states` CustomStateSet.
 * Each state property can have a JSDoc comment that will be extracted for documentation.
 *
 * **Note**: this function will mutate the `newMembers` parameter in order to
 * add new members to the class.
 *
 * @param diagnostics for reporting errors and warnings
 * @param decoratedMembers the decorated members found on the class
 * @param newMembers an out param for new class members
 * @param typeChecker a TypeScript typechecker, needed for resolving the prop
 * declaration name
 * @param decoratorName the name of the decorator to look for
 */
export const attachInternalsDecoratorsToStatic = (
  diagnostics: d.Diagnostic[],
  decoratedMembers: ts.ClassElement[],
  newMembers: ts.ClassElement[],
  typeChecker: ts.TypeChecker,
  decoratorName: string,
) => {
  const attachInternalsMembers = decoratedMembers.filter(ts.isPropertyDeclaration).filter((prop) => {
    return !!retrieveTsDecorators(prop)?.find(isDecoratorNamed(decoratorName));
  });

  // no decorated fields, return!
  if (attachInternalsMembers.length === 0) {
    return;
  }

  // found too many!
  if (attachInternalsMembers.length > 1) {
    const error = buildError(diagnostics);
    error.messageText = `Stencil does not support adding more than one AttachInternals() decorator to a component`;
    return;
  }

  const [decoratedProp] = attachInternalsMembers;

  const { staticName: name } = tsPropDeclName(decoratedProp, typeChecker);

  // Parse decorator options for custom states, extracting JSDoc comments from AST
  const decorator = retrieveTsDecorators(decoratedProp)?.find(isDecoratorNamed(decoratorName));
  const customStates = parseCustomStatesFromDecorator(decorator, typeChecker);

  newMembers.push(createStaticGetter('attachInternalsMemberName', convertValueToLiteral(name)));

  // Only add custom states static getter if there are states defined
  if (customStates.length > 0) {
    newMembers.push(createStaticGetter('attachInternalsCustomStates', convertValueToLiteral(customStates)));
  }
};

/**
 * Parse custom states from the decorator AST, including JSDoc comments.
 *
 * Supports JSDoc comments on state properties:
 * ```ts
 * @AttachInternals({
 *   states: {
 *     hovered: false,
 *     /&#42;&#42; Whether is currently active &#42;/
 *     active: true
 *   }
 * })
 * ```
 *
 * @param decorator the decorator node to parse
 * @returns array of custom state metadata with docs
 */
function parseCustomStatesFromDecorator(
  decorator: ts.Decorator | undefined,
  typeChecker: ts.TypeChecker,
): d.ComponentCompilerCustomState[] {
  if (!decorator || !ts.isCallExpression(decorator.expression)) {
    return [];
  }

  const [firstArg] = decorator.expression.arguments;
  if (!firstArg || !ts.isObjectLiteralExpression(firstArg)) {
    return [];
  }

  // Find the 'states' property in the options object
  const statesProp = firstArg.properties.find(
    (prop): prop is ts.PropertyAssignment =>
      ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'states',
  );

  if (!statesProp || !ts.isObjectLiteralExpression(statesProp.initializer)) {
    return [];
  }

  const customStates: d.ComponentCompilerCustomState[] = [];

  // Iterate through each property in the states object
  for (const prop of statesProp.initializer.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      continue;
    }

    const stateName = ts.isIdentifier(prop.name)
      ? prop.name.text
      : ts.isStringLiteral(prop.name)
        ? prop.name.text
        : null;

    if (!stateName) {
      continue;
    }

    // Get the boolean value
    let initialValue = false;
    if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
      initialValue = true;
    } else if (prop.initializer.kind === ts.SyntaxKind.FalseKeyword) {
      initialValue = false;
    }

    // Extract JSDoc comment using TypeChecker (consistent with rest of codebase)
    const symbol = typeChecker.getSymbolAtLocation(prop.name);
    const docs = symbol ? ts.displayPartsToString(symbol.getDocumentationComment(typeChecker)) : '';

    customStates.push({
      name: stateName,
      initialValue,
      docs,
    });
  }

  return customStates;
}
