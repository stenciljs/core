import { isOutputTargetWww } from '@utils';

import type * as d from '../../declarations';
import { generateServiceWorker } from '../service-worker/generate-sw';

/**
 * Entrypoint to creating a service worker for every `www` output target
 * @param config the Stencil configuration used for the build
 * @param buildCtx the build context associated with the build to mark as done
 */
export const outputServiceWorkers = async (config: d.ValidatedConfig, buildCtx: d.BuildCtx): Promise<void> => {
  const wwwServiceOutputs = config.outputTargets
    .filter(isOutputTargetWww)
    .filter((o) => typeof o.indexHtml === 'string' && !!o.serviceWorker);

  if (wwwServiceOutputs.length === 0 || config.sys.lazyRequire == null) {
    return;
  }

  // let's make sure they have what we need from workbox installed
  const diagnostics = await config.sys.lazyRequire.ensure(config.rootDir, ['workbox-build']);
  if (diagnostics.length > 0) {
    buildCtx.diagnostics.push(...diagnostics);
  } else {
    // we've ensured workbox is installed, so let's require it now
    const workbox: d.Workbox = config.sys.lazyRequire.require(config.rootDir, 'workbox-build');

    await Promise.all(
      wwwServiceOutputs.map((outputTarget) => generateServiceWorker(config, buildCtx, workbox, outputTarget)),
    );
  }
};
