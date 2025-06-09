import { Config } from '../../../src/declarations';

export const config: Config = {
  namespace: 'TestSibling',
  tsconfig: 'tsconfig.json',
  outputTargets: [
    {
      type: 'dist',
      transformAliasedImportPathsInCollection: false,
    },
  ],
  globalScript: 'src/global.ts',
};
