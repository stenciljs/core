import path from 'path';
import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';
// @ts-ignore
import linaria from 'linaria/rollup';
// @ts-ignore
import css from 'rollup-plugin-css-only';
// @ts-ignore
import builtins from 'rollup-plugin-node-builtins';

export const config: Config = {
  namespace: 'EndToEnd',
  globalScript: './src/global.ts',
  globalStyle: './src/global.css',
  plugins: [builtins()],
  rolldownPlugins: {
    after: [
      linaria(),
      css({
        output: path.join(__dirname, 'www', 'linaria.css'),
      }),
    ],
  },
  outputTargets: [
    {
      type: 'www',
      serviceWorker: null,
      copy: [{ src: '**/*.html' }, { src: '**/*.css' }],
    },
    {
      type: 'loader-bundle',
      cjs: true,
    },
    {
      type: 'ssr',
    },
    {
      type: 'docs-json',
      file: 'docs.json',
    },
    {
      type: 'docs-custom-elements-manifest',
      file: 'custom-elements-manifest.json',
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
  hashFileNames: false,
  sourceMap: true,
  extras: {
    experimentalSlotFixes: true,
  },
};
