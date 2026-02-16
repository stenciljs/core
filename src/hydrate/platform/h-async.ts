import { consoleDevError } from '@platform';
import { h } from '@runtime';

import type * as d from '../../declarations';

export const hAsync = (nodeName: any, vnodeData: any, ...children: d.ChildType[]) => {
  if (Array.isArray(children) && children.length > 0) {
    // only return a promise if we have to
    const flatChildren = children.flat(Infinity);
    // has children and at least one of them is async
    // wait on all of them to be resolved
    if (flatChildren.some((child) => child instanceof Promise)) {
      return Promise.all(flatChildren)
        .then((resolvedChildren) => {
          return h(nodeName, vnodeData, ...resolvedChildren);
        })
        .catch((err) => {
          consoleDevError(err);
          return h(nodeName, vnodeData);
        });
    }
    // no async children, just return sync
    return h(nodeName, vnodeData, ...flatChildren);
  }

  // no children, return sync
  return h(nodeName, vnodeData);
};
