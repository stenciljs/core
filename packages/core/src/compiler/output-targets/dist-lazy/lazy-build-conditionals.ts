import type * as d from '@stencil/core';

import { isOutputTargetSsr } from '../../../utils';
import { getBuildFeatures, updateBuildConditionals } from '../../app-core/app-data';

export const getLazyBuildConditionals = (
  config: d.ValidatedConfig,
  cmps: d.ComponentCompilerMeta[],
): d.BuildConditionals => {
  const build = getBuildFeatures(cmps) as d.BuildConditionals;

  build.lazyLoad = true;
  build.hydrateServerSide = false;
  build.asyncQueue = config.taskQueue === 'congestionAsync';
  build.taskQueue = config.taskQueue !== 'immediate';
  build.initializeNextTick = config.extras.initializeNextTick;

  const hasSsrOutputTargets = config.outputTargets.some(isOutputTargetSsr);
  build.hydrateClientSide = hasSsrOutputTargets;

  updateBuildConditionals(config, build);

  return build;
};
