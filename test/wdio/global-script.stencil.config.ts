import type { Config } from '../../internal/index.js';

/**
 * This Stencil configuration is only for the `global-script/` directory.
 */
export const config: Config = {
  namespace: 'TestGlobalScript',
  tsconfig: 'tsconfig-global-script.json',
  outputTargets: [
    {
      type: 'www',
      dir: `www-global-script`,
    },
  ],
  srcDir: 'global-script',
  globalScript: 'global-script/global.ts',
};
