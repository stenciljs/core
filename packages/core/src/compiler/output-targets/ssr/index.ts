import type * as d from '@stencil/core';

import { filterActiveTargets, isOutputTargetSsr } from '../../../utils';
import { generateHydrateApp } from './generate-hydrate-app';

export const outputSsr = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  // Filter hydrate targets based on skipInDev setting
  // (skipInDev is auto-set to false when devServer.ssr is enabled during validation)
  const hydrateOutputTargets = filterActiveTargets(
    config.outputTargets.filter(isOutputTargetSsr),
    config.devMode,
  );

  if (hydrateOutputTargets.length > 0) {
    const timespan = buildCtx.createTimeSpan(`generate hydrate app started`);

    await generateHydrateApp(config, compilerCtx, buildCtx, hydrateOutputTargets);

    timespan.finish(`generate hydrate app finished`);
  }
};

/**
 * @deprecated Use outputSsr instead. This alias will be removed in v6.
 */
export const outputHydrateScript = outputSsr;
