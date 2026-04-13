import type * as d from '@stencil/core';

import { buildError, isValidConfigOutputTarget, VALID_CONFIG_OUTPUT_TARGETS } from '../../../utils';
import { validateStencilMeta } from './validate-stencil-meta';
import { validateStandalone } from './validate-standalone';
import { validateCustomOutput } from './validate-custom-output';
import { validateLoaderBundle } from './validate-loader-bundle';
import { validateDocs } from './validate-docs';
import { validateSsr } from './validate-ssr';
import { validateLazy } from './validate-lazy';
import { validateStats } from './validate-stats';
import { validateWww } from './validate-www';

export const validateOutputTargets = (config: d.ValidatedConfig, diagnostics: d.Diagnostic[]) => {
  const userOutputs = (config.outputTargets || []).slice();

  userOutputs.forEach((outputTarget) => {
    if (!isValidConfigOutputTarget(outputTarget.type)) {
      const err = buildError(diagnostics);
      err.messageText = `Invalid outputTarget type "${
        outputTarget.type
      }". Valid outputTarget types include: ${VALID_CONFIG_OUTPUT_TARGETS.map((t) => `"${t}"`).join(', ')}`;
    }
  });

  config.outputTargets = [
    ...validateStencilMeta(config, userOutputs),
    ...validateStandalone(config, userOutputs),
    ...validateCustomOutput(config, diagnostics, userOutputs),
    ...validateLazy(config, userOutputs),
    ...validateWww(config, diagnostics, userOutputs),
    ...validateLoaderBundle(config, userOutputs),
    ...validateDocs(config, diagnostics, userOutputs),
    ...validateStats(config, userOutputs),
  ];

  // SSR also gets info from the www output
  config.outputTargets = [
    ...config.outputTargets,
    ...validateSsr(config, [...userOutputs, ...config.outputTargets]),
  ];
};
