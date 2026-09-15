import type * as d from '@stencil/core';

import { filterActiveTargets, isOutputTargetSsr } from '../../../utils';
import { generateSsrApp } from './generate-ssr-app';

export const outputSsr = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  // Filter SSR targets based on skipInDev setting
  // (skipInDev is auto-set to false when devServer.ssr is enabled during validation)
  const ssrOutputTargets = filterActiveTargets(
    config.outputTargets.filter(isOutputTargetSsr),
    config.devMode,
  );

  if (ssrOutputTargets.length > 0) {
    const timespan = buildCtx.createTimeSpan(`generate SSR app started`);

    await generateSsrApp(config, compilerCtx, buildCtx, ssrOutputTargets);

    timespan.finish(`generate SSR app finished`);
  }
};
