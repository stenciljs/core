import ts from 'typescript';

import type * as d from '../../../declarations';
import { getStaticValue } from '../transform-utils';

export const parseStaticSerializers = (
  staticMembers: ts.ClassElement[],
  translateType: 'serializers' | 'deserializers',
): d.ComponentCompilerChangeHandler[] => {
  const parsedSerializers: d.ComponentCompilerChangeHandler[] = getStaticValue(staticMembers, translateType);
  if (!parsedSerializers || parsedSerializers.length === 0) {
    return [];
  }

  return parsedSerializers.map((parsedSerial) => {
    return {
      propName: parsedSerial.propName,
      methodName: parsedSerial.methodName,
    };
  });
};
