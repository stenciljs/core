import type * as d from '@stencil/core';

import { filterActiveTargets, isOutputTargetSsrWasm } from '../../../utils';
import { generateSsrWasmApp } from './generate-ssr-wasm';

export const outputSsrWasm = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  const ssrWasmTargets = filterActiveTargets(
    config.outputTargets.filter(isOutputTargetSsrWasm),
    config.devMode,
  );

  if (ssrWasmTargets.length > 0) {
    const timespan = buildCtx.createTimeSpan(`generate SSR WASM started`);
    await generateSsrWasmApp(config, compilerCtx, buildCtx, ssrWasmTargets);
    timespan.finish(`generate SSR WASM finished`);
  }
};
