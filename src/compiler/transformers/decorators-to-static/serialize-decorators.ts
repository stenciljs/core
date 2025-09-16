import { flatOne } from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { convertValueToLiteral, createStaticGetter, retrieveTsDecorators } from '../transform-utils';
import { getDecoratorParameters, isDecoratorNamed } from './decorator-utils';

export const serializeDecoratorsToStatic = (
  typeChecker: ts.TypeChecker,
  decoratedProps: ts.ClassElement[],
  newMembers: ts.ClassElement[],
  decoratorName: string,
  translateType: 'PropSerialize' | 'AttrDeserialize',
) => {
  const serializers = decoratedProps
    .filter(ts.isMethodDeclaration)
    .map((method) => parseSerializeDecorator(typeChecker, method, decoratorName));

  const flatSerializers = flatOne(serializers);

  if (flatSerializers.length > 0) {
    if (translateType === 'PropSerialize') {
      newMembers.push(createStaticGetter('serializers', convertValueToLiteral(flatSerializers)));
    } else {
      newMembers.push(createStaticGetter('deserializers', convertValueToLiteral(flatSerializers)));
    }
  }

  return flatSerializers;
};

const parseSerializeDecorator = (
  typeChecker: ts.TypeChecker,
  method: ts.MethodDeclaration,
  decoratorName: string,
): d.ComponentCompilerChangeHandler[] => {
  const methodName = method.name.getText();
  const decorators = retrieveTsDecorators(method) ?? [];
  return decorators.filter(isDecoratorNamed(decoratorName)).map((decorator) => {
    const [propName] = getDecoratorParameters<string>(decorator, typeChecker);

    return {
      propName,
      methodName,
    };
  });
};
