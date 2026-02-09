import { isOutputTargetHydrate } from '../../../utils';

import type * as d from '@stencil/core';
import { getBuildFeatures, updateBuildConditionals } from '../../app-core/app-data';

export const getLazyBuildConditionals = (
  config: d.ValidatedConfig,
  cmps: d.ComponentCompilerMeta[],
): d.BuildConditionals => {
  const build = getBuildFeatures(cmps) as d.BuildConditionals;

  build.lazyLoad = true;
  build.hydrateServerSide = false;
  // TODO: deprecated in favour of `setTagTransformer` and `transformTag`. Remove in 5.0
  build.transformTagName = config.extras.tagNameTransform;
  build.asyncQueue = config.taskQueue === 'congestionAsync';
  build.taskQueue = config.taskQueue !== 'immediate';
  build.initializeNextTick = config.extras.initializeNextTick;

  const hasHydrateOutputTargets = config.outputTargets.some(isOutputTargetHydrate);
  build.hydrateClientSide = hasHydrateOutputTargets;

  updateBuildConditionals(config, build);

  return build;
};
