import type * as d from '@stencil/core';

import { catchError, COPY, isBoolean, isOutputTargetCustom } from '../../../utils';

export const validateCustomOutput = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  userOutputs: d.OutputTarget[],
) => {
  return userOutputs.filter(isOutputTargetCustom).map((o) => {
    // Custom outputs skip in dev by default (framework wrappers etc.)
    if (!isBoolean(o.skipInDev)) {
      o.skipInDev = true;
    }

    if (o.validate) {
      const localDiagnostics: d.Diagnostic[] = [];
      try {
        o.validate(config, diagnostics);
      } catch (e: any) {
        catchError(localDiagnostics, e);
      }
      if (o.copy && o.copy.length > 0) {
        config.outputTargets.push({
          type: COPY,
          dir: config.rootDir,
          copy: [...o.copy],
        });
      }
      diagnostics.push(...localDiagnostics);
    }
    return o;
  });
};
