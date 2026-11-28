import ts from 'typescript';
import type * as d from '@stencil/core';

import { buildError } from '../../../utils';
import { createStaticGetter, retrieveTsDecorators } from '../transform-utils';
import { isDecoratorNamed } from './decorator-utils';

/**
 * Adds a static `elementRef` getter for an `@Element()` field.
 * @param diagnostics for surfacing errors
 * @param decoratedMembers the class's decorated members
 * @param newMembers out param: the class's members, receiving the static getter
 * @param decoratorName the local name `Element` is imported as
 * @returns the names of the `@Element()` fields
 */
export const elementDecoratorsToStatic = (
  diagnostics: d.Diagnostic[],
  decoratedMembers: ts.ClassElement[],
  newMembers: ts.ClassElement[],
  decoratorName: string,
): string[] => {
  const elementRefs = decoratedMembers
    .filter(ts.isPropertyDeclaration)
    .map((prop) => parseElementDecorator(prop, decoratorName))
    .filter((element): element is string => !!element);

  if (elementRefs.length > 0) {
    newMembers.push(
      createStaticGetter('elementRef', ts.factory.createStringLiteral(elementRefs[0])),
    );
    if (elementRefs.length > 1) {
      const error = buildError(diagnostics);
      error.messageText = `It's not valid to add more than one Element() decorator`;
    }
  }
  return elementRefs;
};

const parseElementDecorator = (
  prop: ts.PropertyDeclaration,
  decoratorName: string,
): string | null => {
  const elementDecorator = retrieveTsDecorators(prop)?.find(isDecoratorNamed(decoratorName));

  if (elementDecorator == null) {
    return null;
  }
  return prop.name.getText();
};
