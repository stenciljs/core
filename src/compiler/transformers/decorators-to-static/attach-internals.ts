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

  newMembers.push(createStaticGetter('attachInternalsMemberName', convertValueToLiteral(name)));
};
