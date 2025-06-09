import { relative } from '@utils';

import type * as d from '../../declarations';

export const generateServiceWorkerUrl = (outputTarget: d.OutputTargetWww, serviceWorker: d.ServiceWorkerConfig) => {
  let swUrl = relative(outputTarget.appDir, serviceWorker.swDest);

  if (swUrl.charAt(0) !== '/') {
    swUrl = '/' + swUrl;
  }

  const baseUrl = new URL(outputTarget.baseUrl, 'http://config.stenciljs.com');
  let basePath = baseUrl.pathname;
  if (!basePath.endsWith('/')) {
    basePath += '/';
  }

  swUrl = basePath + swUrl.substring(1);

  return swUrl;
};
