import { b as bootstrapLazy } from './index-a81GMR2d.js';
export { s as setNonce } from './index-a81GMR2d.js';
import { g as globalScripts } from './app-globals-DQuL1Twl.js';

const defineCustomElements = async (win, options) => {
  if (typeof window === 'undefined') return undefined;
  await globalScripts();
  return bootstrapLazy(
    [
      ['auto-loader-dynamic', [[1, 'auto-loader-dynamic']]],
      ['auto-loader-root', [[1, 'auto-loader-root']]],
      ['auto-loader-child', [[1, 'auto-loader-child']]],
    ],
    options,
  );
};

export { defineCustomElements };
