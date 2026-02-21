import type { Config } from '../../internal/index.js';

export const config: Config = {
  namespace: 'TestInvisiblePrehydrationFalse',
  tsconfig: 'tsconfig-invisible-prehydration.json',
  invisiblePrehydration: false,
  outputTargets: [
    {
      type: 'www',
      empty: false,
      serviceWorker: null,
      dir: 'www-invisible-prehydration',
    },
  ],
  srcDir: 'invisible-prehydration',
};
