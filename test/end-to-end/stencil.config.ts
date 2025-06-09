import { reactOutputTarget } from '@stencil/react-output-target';
import linaria from 'linaria/rollup';
import path from 'path';
import css from 'rollup-plugin-css-only';
import builtins from 'rollup-plugin-node-builtins';

import { Config } from '../../internal';

export const config: Config = {
  namespace: 'EndToEnd',
  globalScript: './src/global.ts',
  globalStyle: './src/global.css',
  plugins: [builtins()],
  rollupPlugins: {
    after: [
      linaria(),
      css({
        output: path.join(__dirname, 'www', 'linaria.css'),
      }),
    ],
  },

  testing: {
    moduleNameMapper: {
      'lodash-es': 'lodash',
    },
  },
  outputTargets: [
    {
      type: 'www',
      empty: false,
      serviceWorker: null,
    },
    {
      type: 'dist',
    },
    {
      type: 'dist-hydrate-script',
    },
    {
      type: 'docs-json',
      file: 'docs.json',
    },
    reactOutputTarget({
      componentCorePackage: '@stencil/e2e-react-output-target',
      proxiesFile: './dist-react/components.ts',
    }),
  ],
  hydratedFlag: {
    name: 'custom-hydrate-flag',
    selector: 'attribute',
    property: 'opacity',
    initialValue: '0',
    hydratedValue: '1',
  },
  env: {
    foo: 'bar',
    HOST: 'example.com',
  },
  enableCache: false,
  hashFileNames: false,
  buildEs5: 'prod',
  sourceMap: true,
  extras: {
    experimentalSlotFixes: true,
  },
};
