import { Config } from '../../internal';

export const config: Config = {
  outputTargets: [
    {
      type: 'dist-custom-elements',
    },
  ],
  hashFileNames: false,
  hydratedFlag: null,
  extras: {
    scriptDataOpts: false,
  },
};
