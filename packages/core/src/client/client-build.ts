import { BUILD } from 'virtual:app-data';
import type * as d from '@stencil/core';

import { CLIENT_BUILD_FLAGS } from '../runtime/runtime-constants';

/**
 * `isDev` / `isTesting` are getters, not copies: the transpile path (e.g. `@stencil/unplugin`)
 * sets `BUILD.*` overrides from each component module, which runs after this module is evaluated.
 */
export const Build: d.UserBuildConditionals = {
  ...CLIENT_BUILD_FLAGS,
  get isDev() {
    return BUILD.isDev;
  },
  get isTesting() {
    return BUILD.isTesting;
  },
};
