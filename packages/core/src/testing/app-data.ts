import type { BuildConditionals } from '@stencil/core';

/**
 * Testing-specific build conditionals.
 *
 * Key differences from production defaults:
 * - `lazyLoad: true` - Required for `getElement()` to work correctly
 * - `isTesting: true` - Enables testing-specific behavior
 * - `isDev: true` - Enables dev-mode checks
 */
export const BUILD: BuildConditionals = {
  allRenderFn: false,
  element: true,
  event: true,
  hasRenderFn: true,
  hostListener: true,
  hostListenerTargetWindow: true,
  hostListenerTargetDocument: true,
  hostListenerTargetBody: true,
  hostListenerTargetParent: false,
  hostListenerTarget: true,
  member: true,
  method: true,
  mode: true,
  observeAttribute: true,
  prop: true,
  propMutable: true,
  reflect: true,
  scoped: true,
  shadowDom: true,
  slot: true,
  cssAnnotations: false,
  state: true,
  style: true,
  formAssociated: false,
  svg: true,
  updatable: true,
  vdomAttribute: true,
  vdomXlink: true,
  vdomClass: true,
  vdomFunctional: true,
  vdomKey: true,
  vdomListener: true,
  vdomRef: true,
  vdomPropOrAttr: true,
  vdomRender: true,
  vdomStyle: true,
  vdomText: true,
  propChangeCallback: true,
  taskQueue: true,
  hotModuleReplacement: false,
  isDebug: false,
  isDev: true,
  isTesting: true,
  hydrateServerSide: false,
  hydrateClientSide: false,
  lifecycleDOMEvents: false,
  lazyLoad: true,  // Critical for getElement() to work
  profile: false,
  slotRelocation: true,
  appendChildSlotFix: false,
  cloneNodeFix: false,
  hydratedAttribute: false,
  hydratedClass: true,
  scopedSlotTextContentFix: false,
  shadowDomShim: false,
  slotChildNodesFix: false,
  invisiblePrehydration: true,
  propBoolean: true,
  propNumber: true,
  propString: true,
  constructableCSS: true,
  devTools: false,
  shadowDelegatesFocus: true,
  shadowSlotAssignmentManual: false,
  initializeNextTick: false,
  asyncLoading: true,
  asyncQueue: false,
  transformTagName: false,
  attachStyles: true,
  experimentalSlotFixes: false,
};

export const Env = {};

export const NAMESPACE = 'app' as string;
