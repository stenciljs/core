import { BUILD } from 'virtual:app-data';
import type * as d from '@stencil/core';

export const Build: d.UserBuildConditionals = {
  isDev: BUILD.isDev,
  isBrowser: true,
  isServer: false,
  isTesting: BUILD.isTesting,
};
