import ts from 'typescript';

import type * as d from '../../../declarations';
import { getStaticValue } from '../transform-utils';

export const parseStaticWatchers = (staticMembers: ts.ClassElement[]): d.ComponentCompilerChangeHandler[] => {
  const parsedWatchers: d.ComponentCompilerChangeHandler[] = getStaticValue(staticMembers, 'watchers');
  if (!parsedWatchers || parsedWatchers.length === 0) {
    return [];
  }

  return parsedWatchers.map((parsedWatch) => {
    return {
      propName: parsedWatch.propName,
      methodName: parsedWatch.methodName,
    };
  });
};
