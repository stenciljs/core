import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'TestPrerender',
  devServer: {
    port: 3334,
  },
  globalStyle: 'src/global/app.css',
  tsconfig: 'tsconfig.stencil.json',
  outputTargets: [
    {
      type: 'www',
      dir: 'www',
      baseUrl: 'https://stenciljs.com/prerender',
      serviceWorker: null,
      empty: false,
      prerenderConfig: './prerender.config.js',
    },
  ],
  srcDir: 'src',
};
