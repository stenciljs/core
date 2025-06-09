import { buildError } from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { createStaticGetter, retrieveTsDecorators } from '../transform-utils';
import { isDecoratorNamed } from './decorator-utils';

export const elementDecoratorsToStatic = (
  diagnostics: d.Diagnostic[],
  decoratedMembers: ts.ClassElement[],
  newMembers: ts.ClassElement[],
  decoratorName: string,
) => {
  const elementRefs = decoratedMembers
    .filter(ts.isPropertyDeclaration)
    .map((prop) => parseElementDecorator(prop, decoratorName))
    .filter((element): element is string => !!element);

  if (elementRefs.length > 0) {
    newMembers.push(createStaticGetter('elementRef', ts.factory.createStringLiteral(elementRefs[0])));
    if (elementRefs.length > 1) {
      const error = buildError(diagnostics);
      error.messageText = `It's not valid to add more than one Element() decorator`;
    }
  }
};

const parseElementDecorator = (prop: ts.PropertyDeclaration, decoratorName: string): string | null => {
  const elementDecorator = retrieveTsDecorators(prop)?.find(isDecoratorNamed(decoratorName));

  if (elementDecorator == null) {
    return null;
  }
  return prop.name.getText();
};
