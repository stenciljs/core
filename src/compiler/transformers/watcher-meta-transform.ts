import ts from 'typescript';

import type * as d from '../../declarations';
import { convertValueToLiteral, createStaticGetter } from './transform-utils';

/**
 * Add a getter to a class for a static representation of the watchers
 * registered on the Stencil component.
 *
 * *Note*: this will conditionally mutate the `classMembers` param, adding a
 * new element.
 *
 * @param classMembers a list of class members
 * @param cmp metadata about the stencil component of interest
 */
export const addWatchers = (classMembers: ts.ClassElement[], cmp: d.ComponentCompilerMeta) => {
  if (cmp.watchers.length > 0) {
    const watcherObj: d.ComponentConstructorWatchers = {};

    cmp.watchers.forEach(({ propName, methodName }) => {
      watcherObj[propName] = watcherObj[propName] || [];
      watcherObj[propName].push(methodName);
    });
    classMembers.push(createStaticGetter('watchers', convertValueToLiteral(watcherObj)));
  }
};
