import { Config } from '../../internal';

export const config: Config = {
  namespace: 'perfbenchmark',
  hashFileNames: false,
  sourceMap: false,
  outputTargets: [
    {
      type: 'www',
      serviceWorker: null,
      empty: true,
    },
  ],
  enableCache: false,
};
