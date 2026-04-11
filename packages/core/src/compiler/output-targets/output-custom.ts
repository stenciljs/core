import type * as d from '@stencil/core';

import { catchError, isOutputTargetCustom } from '../../utils';
import { generateDocData } from '../docs/generate-doc-data';

export const outputCustom = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  if (config._isTesting) {
    return;
  }

  // Custom outputs such as framework proxy generators (vue, react, angular)
  // are dist-only artifacts. Building them during a dev-mode session wastes
  // several hundred ms on every build without providing any value — the
  // developer is not consuming the generated proxies at that point.
  if (config.devMode) {
    return;
  }

  const task = config.watch ? 'always' : 'onBuildOnly';
  const customOutputTargets = config.outputTargets
    .filter(isOutputTargetCustom)
    .filter((o) => (o.taskShouldRun === undefined ? true : o.taskShouldRun === task));

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
