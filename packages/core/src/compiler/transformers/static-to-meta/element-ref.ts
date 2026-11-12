import ts from 'typescript';

import { getStaticValue } from '../transform-utils';

export const parseStaticElementRef = (staticMembers: ts.ClassElement[]) => {
  const parsedElementRef = getStaticValue(staticMembers, 'elementRef');

  if (typeof parsedElementRef === 'string') {
    return parsedElementRef;
  }

  return null;
};
