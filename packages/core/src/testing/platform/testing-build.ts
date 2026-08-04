import type * as d from '@stencil/core';

export const Build: d.UserBuildConditionals = {
  isDev: true,
  isBrowser: false,
  isServer: true,
  isTesting: true,
};
