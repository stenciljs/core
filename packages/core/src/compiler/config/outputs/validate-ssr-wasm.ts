import { isAbsolute } from 'node:path';
import type * as d from '@stencil/core';

import { isBoolean, isOutputTargetSsrWasm, isString, join } from '../../../utils';

export const validateSsrWasm = (config: d.ValidatedConfig, userOutputs: d.OutputTarget[]) => {
  const output: d.OutputTargetSsrWasm[] = [];

  userOutputs.filter(isOutputTargetSsrWasm).forEach((outputTarget) => {
    if (!isString(outputTarget.dir)) {
      outputTarget.dir = 'dist/ssr-wasm';
    }
    if (!isAbsolute(outputTarget.dir)) {
      outputTarget.dir = join(config.rootDir, outputTarget.dir);
    }
    if (!isBoolean(outputTarget.empty)) {
      outputTarget.empty = true;
    }
    if (!isBoolean(outputTarget.minify)) {
      outputTarget.minify = false;
    }
    // ssr-wasm is opt-in only and skipped in dev by default
    if (!isBoolean(outputTarget.skipInDev)) {
      outputTarget.skipInDev = true;
    }
    output.push(outputTarget);
  });

  return output;
};
