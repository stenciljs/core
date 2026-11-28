import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'sourcemaps',
  sourceMap: true,
  // two lazy bundles sharing `utils/format`, so there's a shared chunk as well as entries
  bundles: [{ components: ['cmp-a', 'cmp-b'] }, { components: ['cmp-c'] }],
  outputTargets: [
    // `skipInDev: false` so the `--dev` build checks every target too
    { type: 'loader-bundle', skipInDev: false },
    { type: 'standalone', skipInDev: false },
    { type: 'www' },
    { type: 'collection', skipInDev: false },
  ],
};
