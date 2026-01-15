import { Config } from '../../internal';

export const config: Config = {
  namespace: 'bundlesize',
  hashFileNames: false,
  outputTargets: [{ type: 'dist' }],
  enableCache: false,
};
