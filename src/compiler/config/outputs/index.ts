import { buildError, isValidConfigOutputTarget, VALID_CONFIG_OUTPUT_TARGETS } from '@utils';

import type * as d from '../../../declarations';
import { validateCollection } from './validate-collection';
import { validateCustomElement } from './validate-custom-element';
import { validateCustomOutput } from './validate-custom-output';
import { validateDist } from './validate-dist';
import { validateDocs } from './validate-docs';
import { validateHydrateScript } from './validate-hydrate-script';
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
    ...validateCollection(config, userOutputs),
    ...validateCustomElement(config, userOutputs),
    ...validateCustomOutput(config, diagnostics, userOutputs),
    ...validateLazy(config, userOutputs),
    ...validateWww(config, diagnostics, userOutputs),
    ...validateDist(config, userOutputs),
    ...validateDocs(config, diagnostics, userOutputs),
    ...validateStats(config, userOutputs),
  ];

  // hydrate also gets info from the www output
  config.outputTargets = [
    ...config.outputTargets,
    ...validateHydrateScript(config, [...userOutputs, ...config.outputTargets]),
  ];
};
