import ts from 'typescript';

import type * as d from '../../../declarations';
import { getStaticValue } from '../transform-utils';

export const parseStaticStates = (staticMembers: ts.ClassElement[]): d.ComponentCompilerState[] => {
  const parsedStates = getStaticValue(staticMembers, 'states');
  if (!parsedStates) {
    return [];
  }

  const stateNames = Object.keys(parsedStates);
  if (stateNames.length === 0) {
    return [];
  }

  return stateNames.map((stateName) => {
    return {
      name: stateName,
    };
  });
};
