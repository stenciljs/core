import type * as d from '@stencil/core';

import { isOutputTargetHydrate } from '../../../utils';
import { generateHydrateApp } from './generate-hydrate-app';

export const outputHydrateScript = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  // The hydrate app is a server-side rendering artifact. In dev mode it is
  // only needed when `devServer.ssr` is enabled or `buildDist` is explicitly
  // set to true. Skip it otherwise to avoid an extra rolldown build on startup.
  if (config.devMode && !config.devServer?.ssr && !config.buildDist) {
    return;
  }

  const hydrateOutputTargets = config.outputTargets.filter(isOutputTargetHydrate);
  if (hydrateOutputTargets.length > 0) {
    const timespan = buildCtx.createTimeSpan(`generate hydrate app started`);

    await generateHydrateApp(config, compilerCtx, buildCtx, hydrateOutputTargets);

    timespan.finish(`generate hydrate app finished`);
  }
};
