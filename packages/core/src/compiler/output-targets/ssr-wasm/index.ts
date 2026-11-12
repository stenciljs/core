import type * as d from '@stencil/core';

import { filterActiveTargets, isOutputTargetSsr, isOutputTargetSsrWasm } from '../../../utils';
import { validateSsrReservedAttributes } from '../ssr/validate-reserved-attributes';
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
    // the `ssr` output reports these already
    const ssrTargets = filterActiveTargets(
      config.outputTargets.filter(isOutputTargetSsr),
      config.devMode,
    );
    if (ssrTargets.length === 0) validateSsrReservedAttributes(config, buildCtx);
    const timespan = buildCtx.createTimeSpan(`generate SSR WASM started`);
    await generateSsrWasmApp(config, compilerCtx, buildCtx, ssrWasmTargets);
    timespan.finish(`generate SSR WASM finished`);
  }
};
