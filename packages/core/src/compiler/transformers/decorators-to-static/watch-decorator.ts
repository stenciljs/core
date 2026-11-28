import ts from 'typescript';
import type * as d from '@stencil/core';

import { augmentDiagnosticWithNode, buildError, flatOne } from '../../../utils';
import {
  convertValueToLiteral,
  createStaticGetter,
  retrieveTsDecorators,
} from '../transform-utils';
import { getDecoratorParameters, isDecoratorNamed } from './decorator-utils';

export const watchDecoratorsToStatic = (
  diagnostics: d.Diagnostic[],
  typeChecker: ts.TypeChecker,
  decoratedProps: ts.ClassElement[],
  newMembers: ts.ClassElement[],
  decoratorName: string,
) => {
  const watchers = decoratedProps
    .filter(ts.isMethodDeclaration)
    .map((method) => parseWatchDecorator(diagnostics, typeChecker, method, decoratorName));

  const flatWatchers = flatOne(watchers);

  if (flatWatchers.length > 0) {
    newMembers.push(createStaticGetter('watchers', convertValueToLiteral(flatWatchers)));
  }
};

const parseWatchDecorator = (
  diagnostics: d.Diagnostic[],
  typeChecker: ts.TypeChecker,
  method: ts.MethodDeclaration,
  decoratorName: string,
): d.ComponentCompilerChangeHandler[] => {
  const methodName = method.name.getText();
  const decorators = retrieveTsDecorators(method) ?? [];
  return decorators.filter(isDecoratorNamed(decoratorName)).flatMap((decorator) => {
    const [propName, handlerOptions] = getDecoratorParameters<string, { immediate?: boolean }>(
      decorator,
      typeChecker,
    );

    if (typeof propName !== 'string') {
      const err = buildError(diagnostics);
      err.messageText = `@Watch() expects the name of a member as a string, received ${JSON.stringify(propName)}.`;
      augmentDiagnosticWithNode(err, decorator);
      return [];
    }

    if (handlerOptions) {
      return {
        propName,
        methodName,
        handlerOptions,
      };
    }

    return {
      propName,
      methodName,
    };
  });
};
