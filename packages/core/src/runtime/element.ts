import { BUILD } from 'virtual:app-data';
import { getHostRef } from 'virtual:platform';

import type * as d from '../declarations';

export const getElement = (ref: any) => (BUILD.lazyLoad ? getHostRef(ref)?.$hostElement$ : (ref as d.HostElement));
