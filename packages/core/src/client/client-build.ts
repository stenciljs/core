import { BUILD } from 'virtual:app-data';
import type * as d from '@stencil/core';

import { CLIENT_BUILD_FLAGS } from '../runtime/runtime-constants';

export const Build: d.UserBuildConditionals = {
  ...CLIENT_BUILD_FLAGS,
  isDev: BUILD.isDev,
  isTesting: BUILD.isTesting,
};
