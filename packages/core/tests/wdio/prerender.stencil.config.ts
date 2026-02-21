import type { Config } from '../../internal/index.js';

export const config: Config = {
  namespace: 'TestPrerender',
  globalStyle: 'test-prerender/src/global/app.css',
  tsconfig: 'tsconfig-prerender.json',
  outputTargets: [
    {
      type: 'www',
      dir: `www-prerender-script`,
      baseUrl: 'https://wdio.stenciljs.com/prerender',
      serviceWorker: null,
      empty: false,
      prerenderConfig: './test-prerender/prerender.config.js',
    },
  ],
};
