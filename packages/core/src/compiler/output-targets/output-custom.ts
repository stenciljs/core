import type * as d from '@stencil/core';

import { catchError, filterActiveTargets, isOutputTargetCustom } from '../../utils';
import { generateDocData } from '../docs/generate-doc-data';

export const outputCustom = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  if (config._isTesting) {
    return;
  }

  const task = config.watch ? 'always' : 'onBuildOnly';
  // Filter custom targets based on skipInDev setting and taskShouldRun
  const customOutputTargets = filterActiveTargets(
    config.outputTargets
      .filter(isOutputTargetCustom)
      .filter((o) => (o.taskShouldRun === undefined ? true : o.taskShouldRun === task)),
    config.devMode,
  );

  if (customOutputTargets.length === 0) {
    return;
  }
  const docsData = await generateDocData(config, compilerCtx, buildCtx);

  await Promise.all(
    customOutputTargets.map(async (o) => {
      const timespan = buildCtx.createTimeSpan(`generating ${o.name} started`);
      try {
        await o.generator(config, compilerCtx, buildCtx, docsData);
      } catch (e: any) {
        catchError(buildCtx.diagnostics, e);
      }
      timespan.finish(`generate ${o.name} finished`);
    }),
  );
};
