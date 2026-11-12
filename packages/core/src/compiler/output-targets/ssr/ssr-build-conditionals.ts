import type * as d from '@stencil/core';

import { getBuildFeatures, updateBuildConditionals } from '../../app-core/app-data';

/**
 * Get the `BUILD` conditionals for the ssr build based on the current
 * project
 *
 * @param config a validated Stencil configuration
 * @param cmps component metadata
 * @returns a populated build conditional object
 */
export const getSsrBuildConditionals = (
  config: d.ValidatedConfig,
  cmps: d.ComponentCompilerMeta[],
) => {
  const build = getBuildFeatures(cmps) as d.BuildConditionals;
  // we need to make sure that things like the hydratedClass and flag are
  // set for the ssr build
  updateBuildConditionals(config, build);

  build.slotRelocation = true;
  build.lazyLoad = true;
  build.hydrateServerSide = true;
  build.hydrateClientSide = true;
  build.isDebug = false;
  build.isDev = false;
  build.isTesting = false;
  build.devTools = false;
  build.lifecycleDOMEvents = false;
  build.profile = false;
  build.hotModuleReplacement = false;
  build.updatable = true;
  build.member = true;
  build.constructableCSS = false;
  build.asyncLoading = true;
  build.lightDomPatches = false;
  build.slotChildNodes = false;
  build.slotCloneNode = false;
  build.slotDomMutations = false;
  build.slotTextContent = false;
  build.cssAnnotations = true;

  return build;
};
