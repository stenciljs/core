import { isOutputTargetStats, join, STATS } from '@utils';
import { isAbsolute } from 'path';

import type * as d from '../../../declarations';

export const validateStats = (userConfig: d.ValidatedConfig, userOutputs: d.OutputTarget[]) => {
  const outputTargets: d.OutputTargetStats[] = [];

  if (userConfig.flags.stats) {
    const hasOutputTarget = userOutputs.some(isOutputTargetStats);
    if (!hasOutputTarget) {
      outputTargets.push({
        type: STATS,
      });
    }
  }

  outputTargets.push(...userOutputs.filter(isOutputTargetStats));
  outputTargets.forEach((outputTarget) => {
    if (!outputTarget.file) {
      outputTarget.file = 'stencil-stats.json';
    }

    if (!isAbsolute(outputTarget.file)) {
      outputTarget.file = join(userConfig.rootDir, outputTarget.file);
    }
  });

  return outputTargets;
};
