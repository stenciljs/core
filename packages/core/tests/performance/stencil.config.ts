import { Config } from '../../internal';

export const config: Config = {
  namespace: 'app',
  minifyJs: false,
  taskQueue: 'async',
  outputTargets: [
    {
      type: 'www',
      serviceWorker: null,
    },
  ],
};
