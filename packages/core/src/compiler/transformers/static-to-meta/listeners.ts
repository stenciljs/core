import ts from 'typescript';

import type * as d from '../../../declarations';
import { getStaticValue } from '../transform-utils';

export const parseStaticListeners = (staticMembers: ts.ClassElement[]): d.ComponentCompilerListener[] => {
  const parsedListeners: d.ComponentCompilerListener[] = getStaticValue(staticMembers, 'listeners');
  if (!parsedListeners || parsedListeners.length === 0) {
    return [];
  }

  return parsedListeners.map((parsedListener) => {
    return {
      name: parsedListener.name,
      method: parsedListener.method,
      capture: !!parsedListener.capture,
      passive: !!parsedListener.passive,
      target: parsedListener.target,
    };
  });
};
