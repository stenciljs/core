import { Config } from '../../internal';

export const config: Config = {
  globalStyle: 'src/global/app.css',
  outputTargets: [
    {
      type: 'www',
      serviceWorker: null,
    },
  ],
  hashFileNames: false,
  hydratedFlag: null,
  extras: {
    scriptDataOpts: false,
  },
};
