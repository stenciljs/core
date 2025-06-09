import { isOutputTargetHydrate } from '@utils';

import type * as d from '../../../declarations';
import { getBuildFeatures, updateBuildConditionals } from '../../app-core/app-data';
/**
 * Get build conditions appropriate for the `dist-custom-elements` Output
 * Target, including disabling lazy loading and hydration.
 *
 * @param config a validated user-supplied config
 * @param cmps metadata about the components currently being compiled
 * @returns build conditionals appropriate for the `dist-custom-elements` OT
 */
export const getCustomElementsBuildConditionals = (
  config: d.ValidatedConfig,
  cmps: d.ComponentCompilerMeta[],
): d.BuildConditionals => {
  // because custom elements bundling does not customize the build conditionals by default
  // then the default in "import { BUILD, NAMESPACE } from '@stencil/core/internal/app-data'"
  // needs to have the static build conditionals set for the custom elements build
  const build = getBuildFeatures(cmps) as d.BuildConditionals;
  const hasHydrateOutputTargets = config.outputTargets.some(isOutputTargetHydrate);

  build.lazyLoad = false;
  build.hydrateClientSide = hasHydrateOutputTargets;
  build.hydrateServerSide = false;
  build.asyncQueue = config.taskQueue === 'congestionAsync';
  build.taskQueue = config.taskQueue !== 'immediate';
  updateBuildConditionals(config, build);
  build.devTools = false;

  return build;
};
