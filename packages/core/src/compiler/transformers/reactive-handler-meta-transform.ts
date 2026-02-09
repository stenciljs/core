import ts from 'typescript';

import type * as d from '@stencil/core';
import { convertValueToLiteral, createStaticGetter } from './transform-utils';
import { WATCH_FLAGS } from '../../utils';

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
export const addReactivePropHandlers = (
  classMembers: ts.ClassElement[],
  cmp: d.ComponentCompilerMeta,
  decorator: 'watchers' | 'serializers' | 'deserializers',
) => {
  if (cmp[decorator].length > 0) {
    const watcherObj: d.ComponentConstructorChangeHandlers = {};

    cmp[decorator].forEach(({ propName, methodName, handlerOptions }) => {
      watcherObj[propName] = watcherObj[propName] || [];

      let watcherFlags = 0;
      if (handlerOptions?.immediate) {
        watcherFlags |= WATCH_FLAGS.Immediate;
      }
      watcherObj[propName].push({ [methodName]: watcherFlags });
    });
    classMembers.push(createStaticGetter(decorator, convertValueToLiteral(watcherObj)));
  }
};
