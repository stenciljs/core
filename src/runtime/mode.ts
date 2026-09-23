import { getHostRef, modeResolver } from '@platform';

import type * as d from '../declarations';

// Private
export const computeMode = (elm: d.HostElement) => modeResolver.map((h) => h(elm)).find((m) => !!m);

// Public
export const setMode = (handler: d.ResolutionHandler) => {
  modeResolver.length = 0;
  modeResolver.push(handler);
};
export const getMode = (ref: d.RuntimeRef) => getHostRef(ref)?.$modeName$;
