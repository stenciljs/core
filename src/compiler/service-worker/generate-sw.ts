import { buildWarn, catchError, isOutputTargetWww } from '@utils';
import { basename } from 'path';

import type * as d from '../../declarations';

export const generateServiceWorker = async (
  config: d.ValidatedConfig,
  buildCtx: d.BuildCtx,
  workbox: d.Workbox,
  outputTarget: d.OutputTargetWww,
): Promise<void[] | void> => {
  const serviceWorker = await getServiceWorker(outputTarget);
  if (serviceWorker.unregister) {
    await config.sys.writeFile(serviceWorker.swDest, SELF_UNREGISTER_SW);
  } else if (serviceWorker.swSrc) {
    return Promise.all([copyLib(buildCtx, outputTarget, workbox), injectManifest(buildCtx, serviceWorker, workbox)]);
  } else {
    return generateSW(buildCtx, serviceWorker, workbox);
  }
};

const copyLib = async (buildCtx: d.BuildCtx, outputTarget: d.OutputTargetWww, workbox: d.Workbox) => {
  const timeSpan = buildCtx.createTimeSpan(`copy service worker library started`, true);

  try {
    await workbox.copyWorkboxLibraries(outputTarget.appDir);
  } catch (e) {
    const d = buildWarn(buildCtx.diagnostics);
    d.messageText = 'Service worker library already exists';
  }

  timeSpan.finish(`copy service worker library finished`);
};

const generateSW = async (buildCtx: d.BuildCtx, serviceWorker: d.ServiceWorkerConfig, workbox: d.Workbox) => {
  const timeSpan = buildCtx.createTimeSpan(`generate service worker started`);

  try {
    await workbox.generateSW(serviceWorker);
    timeSpan.finish(`generate service worker finished`);
  } catch (e: any) {
    catchError(buildCtx.diagnostics, e);
  }
};

const injectManifest = async (buildCtx: d.BuildCtx, serviceWorker: d.ServiceWorkerConfig, workbox: d.Workbox) => {
  const timeSpan = buildCtx.createTimeSpan(`inject manifest into service worker started`);

  try {
    await workbox.injectManifest(serviceWorker);
    timeSpan.finish('inject manifest into service worker finished');
  } catch (e: any) {
    catchError(buildCtx.diagnostics, e);
  }
};

export const hasServiceWorkerChanges = (config: d.ValidatedConfig, buildCtx: d.BuildCtx) => {
  if (config.devMode && !config.flags.serviceWorker) {
    return false;
  }

  const wwwServiceOutputs = config.outputTargets
    .filter(isOutputTargetWww)
    .filter((o) => o.serviceWorker && o.serviceWorker.swSrc);

  return wwwServiceOutputs.some((outputTarget) => {
    return buildCtx.filesChanged.some((fileChanged) => {
      if (outputTarget.serviceWorker) {
        return basename(fileChanged).toLowerCase() === basename(outputTarget.serviceWorker.swSrc).toLowerCase();
      }
      return false;
    });
  });
};

const getServiceWorker = async (outputTarget: d.OutputTargetWww) => {
  if (!outputTarget.serviceWorker) {
    return undefined;
  }

  const serviceWorker: d.ServiceWorkerConfig = {
    ...outputTarget.serviceWorker,
  };

  if (serviceWorker.unregister !== true) {
    delete serviceWorker.unregister;
  }

  return serviceWorker;
};

export const INDEX_ORG = 'index-org.html';

export const getRegisterSW = (swUrl: string) => {
  return `
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('${swUrl}')
      .then(function(reg) {
        reg.onupdatefound = function() {
          var installingWorker = reg.installing;
          installingWorker.onstatechange = function() {
            if (installingWorker.state === 'installed') {
              window.dispatchEvent(new Event('swUpdate'))
            }
          }
        }
      })
      .catch(function(err) { console.error('service worker error', err) });
  });
}`;
};

export const UNREGISTER_SW = `
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // auto-unregister service worker during dev mode
  navigator.serviceWorker.getRegistration().then(function(registration) {
    if (registration) {
      registration.unregister().then(function() { location.reload(true) });
    }
  });
}
`;

export const SELF_UNREGISTER_SW = `
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  self.registration.unregister()
    .then(function() {
      return self.clients.matchAll();
    })
    .then(function(clients) {
      clients.forEach(client => client.navigate(client.url))
    });
});
`;
