import { Config } from '../../internal';
import { sass } from '@stencil/sass';

export const config: Config = {
  hashFileNames: false,

  outputTargets: [
    {
      type: 'www',
      serviceWorker: null,
    },
  ],
  globalScript: 'src/global.ts',
  enableCache: false,
  plugins: [sass()],
};
