import type * as d from '@stencil/core/internal';

/**
 * Reset build conditionals used for testing to a known "good state".
 *
 * This function does not return a value, but rather mutates its argument in place.
 * Certain values are set to `true` or `false` for testing purpose (see this function's implementation for the full
 * list). Build conditional options _not_ in that list that are set to `true` when this function is invoked will remain
 * set to `true`.
 *
 * @param b the build conditionals to reset.
 */
export function resetBuildConditionals(b: d.BuildConditionals) {
  Object.keys(b).forEach((key) => {
    (b as any)[key] = true;
  });

  b.isDev = true;
  b.isTesting = true;
  b.isDebug = false;
  b.lazyLoad = true;
  b.member = true;
  b.reflect = true;
  b.scoped = true;
  b.shadowDom = true;
  b.slotRelocation = true;
  b.asyncLoading = true;
  b.svg = true;
  b.updatable = true;
  b.vdomAttribute = true;
  b.vdomClass = true;
  b.vdomFunctional = true;
  b.vdomKey = true;
  b.vdomPropOrAttr = true;
  b.vdomRef = true;
  b.vdomListener = true;
  b.vdomStyle = true;
  b.vdomText = true;
  b.vdomXlink = true;
  b.allRenderFn = false;
  b.devTools = false;
  b.hydrateClientSide = false;
  b.hydrateServerSide = false;
  b.cssAnnotations = false;
  b.style = false;
  b.hydratedAttribute = false;
  b.hydratedClass = true;
  b.invisiblePrehydration = true;
  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  b.appendChildSlotFix = false;
  b.cloneNodeFix = false;
  b.hotModuleReplacement = false;
  // TODO(STENCIL-1305): remove this option
  b.scriptDataOpts = false;
  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  b.scopedSlotTextContentFix = false;
  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  b.slotChildNodesFix = false;
  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  b.experimentalSlotFixes = false;
  // TODO(STENCIL-1086): remove this option when it's the default behavior
  b.experimentalScopedSlotChanges = false;
}
