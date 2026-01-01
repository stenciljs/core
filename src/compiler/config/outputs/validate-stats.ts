import { isOutputTargetStats, join, STATS } from '@utils';
import { isAbsolute } from 'path';

import type * as d from '../../../declarations';

export const validateStats = (userConfig: d.ValidatedConfig, userOutputs: d.OutputTarget[]) => {
  const outputTargets: d.OutputTargetStats[] = [];

  if (userConfig.flags.stats) {
    const hasOutputTarget = userOutputs.some(isOutputTargetStats);
    if (!hasOutputTarget) {
      const statsOutput: d.OutputTargetStats = {
        type: STATS,
      };

      // If --stats was provided with a path (string), use it; otherwise use default
      if (typeof userConfig.flags.stats === 'string') {
        statsOutput.file = userConfig.flags.stats;
      }

      outputTargets.push(statsOutput);
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
