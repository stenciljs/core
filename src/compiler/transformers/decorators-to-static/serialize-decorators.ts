import ts from 'typescript';

import { convertValueToLiteral, createStaticGetter, retrieveTsDecorators, tsPropDeclName } from '../transform-utils';
import { getDecoratorParameters, isDecoratorNamed } from './decorator-utils';

export const serializeDecoratorsToStatic = (
  typeChecker: ts.TypeChecker,
  decoratedProps: ts.ClassElement[],
  newMembers: ts.ClassElement[],
  decoratorName: string,
  translateType: 'PropSerialize' | 'AttrDeserialize',
  propDecoratorName: string,
) => {
  // we only care about `@Prop` decorated properties
  const props: string[] = decoratedProps
    .filter((prop) => ts.isPropertyDeclaration(prop) || ts.isGetAccessor(prop))
    .flatMap((prop) => {
      if (retrieveTsDecorators(prop)?.find(isDecoratorNamed(propDecoratorName))) {
        const { staticName } = tsPropDeclName(prop, typeChecker);
        return [staticName];
      }
      return [];
    });

  const serializers = decoratedProps
    .filter(ts.isMethodDeclaration)
    .flatMap((method) => parseSerializeDecorator(typeChecker, method, decoratorName, props));

  if (serializers.length > 0) {
    if (translateType === 'PropSerialize') {
      newMembers.push(createStaticGetter('serializers', convertValueToLiteral(serializers)));
    } else {
      newMembers.push(createStaticGetter('deserializers', convertValueToLiteral(serializers)));
    }
  }

  return serializers;
};

const parseSerializeDecorator = (
  typeChecker: ts.TypeChecker,
  method: ts.MethodDeclaration,
  decoratorName: string,
  props: string[],
) => {
  const methodName = method.name.getText();
  const decorators = retrieveTsDecorators(method) ?? [];

  return decorators.filter(isDecoratorNamed(decoratorName)).flatMap((decorator) => {
    const [propName] = getDecoratorParameters<string>(decorator, typeChecker);

    if (!props.includes(propName)) {
      // ignore if there's no corresponding @Prop decorated property
      return [];
    }

    return [
      {
        propName,
        methodName,
      },
    ];
  });
};
