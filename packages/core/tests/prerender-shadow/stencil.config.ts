import { Config } from '../../internal';

export const config: Config = {
  hashFileNames: false,
  minifyJs: false,
  outputTargets: [
    {
      type: 'www',
      baseUrl: 'http://testing.stenciljs.com',
      serviceWorker: null,
    },
    {
      type: 'dist-hydrate-script',
      dir: 'dist/hydrate',
    },
  ],

  enableCache: false,
};
