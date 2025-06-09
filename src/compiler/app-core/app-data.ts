import {
  BuildConditionals,
  BuildFeatures,
  ComponentCompilerMeta,
  Module,
  ModuleMap,
  ValidatedConfig,
} from '@stencil/core/internal';
import { unique } from '@utils';

/**
 * Re-export {@link BUILD} defaults
 */
export * from '../../app-data';

/**
 * Generate a {@link BuildFeatures} entity, based on the provided component metadata
 * @param cmps a collection of component compiler metadata, used to set values on the generated build features object
 * @returns the generated build features entity
 */
export const getBuildFeatures = (cmps: ComponentCompilerMeta[]): BuildFeatures => {
  const slot = cmps.some((c) => c.htmlTagNames.includes('slot'));
  const shadowDom = cmps.some((c) => c.encapsulation === 'shadow');
  const slotRelocation = cmps.some((c) => c.encapsulation !== 'shadow' && c.htmlTagNames.includes('slot'));
  const f: BuildFeatures = {
    allRenderFn: cmps.every((c) => c.hasRenderFn),
    formAssociated: cmps.some((c) => c.formAssociated),

    element: cmps.some((c) => c.hasElement),
    event: cmps.some((c) => c.hasEvent),
    hasRenderFn: cmps.some((c) => c.hasRenderFn),
    lifecycle: cmps.some((c) => c.hasLifecycle),
    asyncLoading: true,
    hostListener: cmps.some((c) => c.hasListener),
    hostListenerTargetWindow: cmps.some((c) => c.hasListenerTargetWindow),
    hostListenerTargetDocument: cmps.some((c) => c.hasListenerTargetDocument),
    hostListenerTargetBody: cmps.some((c) => c.hasListenerTargetBody),
    hostListenerTargetParent: cmps.some((c) => c.hasListenerTargetParent),
    hostListenerTarget: cmps.some((c) => c.hasListenerTarget),
    member: cmps.some((c) => c.hasMember),
    method: cmps.some((c) => c.hasMethod),
    mode: cmps.some((c) => c.hasMode),
    modernPropertyDecls: cmps.some((c) => c.hasModernPropertyDecls),
    observeAttribute: cmps.some((c) => c.hasAttribute || c.hasWatchCallback),
    prop: cmps.some((c) => c.hasProp),
    propBoolean: cmps.some((c) => c.hasPropBoolean),
    propNumber: cmps.some((c) => c.hasPropNumber),
    propString: cmps.some((c) => c.hasPropString),
    propMutable: cmps.some((c) => c.hasPropMutable),
    reflect: cmps.some((c) => c.hasReflect),
    scoped: cmps.some((c) => c.encapsulation === 'scoped'),
    shadowDom,
    shadowDelegatesFocus: shadowDom && cmps.some((c) => c.shadowDelegatesFocus),
    slot,
    slotRelocation,
    state: cmps.some((c) => c.hasState),
    style: cmps.some((c) => c.hasStyle),
    svg: cmps.some((c) => c.htmlTagNames.includes('svg')),
    updatable: cmps.some((c) => c.isUpdateable),
    vdomAttribute: cmps.some((c) => c.hasVdomAttribute),
    vdomXlink: cmps.some((c) => c.hasVdomXlink),
    vdomClass: cmps.some((c) => c.hasVdomClass),
    vdomFunctional: cmps.some((c) => c.hasVdomFunctional),
    vdomKey: cmps.some((c) => c.hasVdomKey),
    vdomListener: cmps.some((c) => c.hasVdomListener),
    vdomPropOrAttr: cmps.some((c) => c.hasVdomPropOrAttr),
    vdomRef: cmps.some((c) => c.hasVdomRef),
    vdomRender: cmps.some((c) => c.hasVdomRender),
    vdomStyle: cmps.some((c) => c.hasVdomStyle),
    vdomText: cmps.some((c) => c.hasVdomText),
    watchCallback: cmps.some((c) => c.hasWatchCallback),
    taskQueue: true,
  };
  f.vdomAttribute = f.vdomAttribute || f.reflect;
  f.vdomPropOrAttr = f.vdomPropOrAttr || f.reflect;

  return f;
};

export const updateComponentBuildConditionals = (moduleMap: ModuleMap, cmps: ComponentCompilerMeta[]) => {
  cmps.forEach((cmp) => {
    const importedModules = getModuleImports(moduleMap, cmp.sourceFilePath, []);
    importedModules.forEach((importedModule) => {
      // if the component already has a boolean true value it'll keep it
      // otherwise we get the boolean value from the imported module
      cmp.hasVdomAttribute = cmp.hasVdomAttribute || importedModule.hasVdomAttribute;
      cmp.hasVdomPropOrAttr = cmp.hasVdomPropOrAttr || importedModule.hasVdomPropOrAttr;
      cmp.hasVdomXlink = cmp.hasVdomXlink || importedModule.hasVdomXlink;
      cmp.hasVdomClass = cmp.hasVdomClass || importedModule.hasVdomClass;
      cmp.hasVdomFunctional = cmp.hasVdomFunctional || importedModule.hasVdomFunctional;
      cmp.hasVdomKey = cmp.hasVdomKey || importedModule.hasVdomKey;
      cmp.hasVdomListener = cmp.hasVdomListener || importedModule.hasVdomListener;
      cmp.hasVdomRef = cmp.hasVdomRef || importedModule.hasVdomRef;
      cmp.hasVdomRender = cmp.hasVdomRender || importedModule.hasVdomRender;
      cmp.hasVdomStyle = cmp.hasVdomStyle || importedModule.hasVdomStyle;
      cmp.hasVdomText = cmp.hasVdomText || importedModule.hasVdomText;

      cmp.htmlAttrNames.push(...importedModule.htmlAttrNames);
      cmp.htmlTagNames.push(...importedModule.htmlTagNames);
      cmp.potentialCmpRefs.push(...importedModule.potentialCmpRefs);
    });

    cmp.htmlAttrNames = unique(cmp.htmlAttrNames);
    cmp.htmlTagNames = unique(cmp.htmlTagNames);
    cmp.potentialCmpRefs = unique(cmp.potentialCmpRefs);
  });
};

const getModuleImports = (moduleMap: ModuleMap, filePath: string, importedModules: Module[]) => {
  let moduleFile = moduleMap.get(filePath);
  if (moduleFile == null) {
    moduleFile = moduleMap.get(filePath + '.tsx');
    if (moduleFile == null) {
      moduleFile = moduleMap.get(filePath + '.ts');
      if (moduleFile == null) {
        moduleFile = moduleMap.get(filePath + '.js');
      }
    }
  }

  if (moduleFile != null && !importedModules.some((m) => m.sourceFilePath === moduleFile.sourceFilePath)) {
    importedModules.push(moduleFile);

    moduleFile.localImports.forEach((localImport) => {
      getModuleImports(moduleMap, localImport, importedModules);
    });
  }
  return importedModules;
};

/**
 * Update the provided build conditionals object in-line with a provided Stencil project configuration
 *
 * **This function mutates the build conditionals argument**
 *
 * @param config the Stencil configuration to use to update the provided build conditionals
 * @param b the build conditionals to update
 */
export const updateBuildConditionals = (config: ValidatedConfig, b: BuildConditionals): void => {
  b.isDebug = config.logLevel === 'debug';
  b.isDev = !!config.devMode;
  b.isTesting = !!config._isTesting;
  b.devTools = b.isDev && !config._isTesting;
  b.profile = !!config.profile;
  b.hotModuleReplacement = !!(
    config.devMode &&
    config.devServer &&
    config.devServer.reloadStrategy === 'hmr' &&
    !config._isTesting
  );
  b.updatable = b.updatable || b.hydrateClientSide || b.hotModuleReplacement;
  b.member = b.member || b.updatable || b.mode || b.lifecycle;
  b.constructableCSS = !b.hotModuleReplacement || !!config._isTesting;
  b.asyncLoading = !!(b.asyncLoading || b.lazyLoad || b.taskQueue || b.initializeNextTick);
  b.cssAnnotations = true;
  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  b.appendChildSlotFix = config.extras.appendChildSlotFix;
  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  b.slotChildNodesFix = config.extras.slotChildNodesFix;
  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  b.experimentalSlotFixes = config.extras.experimentalSlotFixes;
  // TODO(STENCIL-1086): remove this option when it's the default behavior
  b.experimentalScopedSlotChanges = config.extras.experimentalScopedSlotChanges;
  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  b.cloneNodeFix = config.extras.cloneNodeFix;
  b.lifecycleDOMEvents = !!(b.isDebug || config._isTesting || config.extras.lifecycleDOMEvents);
  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  b.scopedSlotTextContentFix = !!config.extras.scopedSlotTextContentFix;
  // TODO(STENCIL-1305): remove this option
  b.scriptDataOpts = config.extras.scriptDataOpts;
  b.attachStyles = true;
  b.invisiblePrehydration = typeof config.invisiblePrehydration === 'undefined' ? true : config.invisiblePrehydration;
  // TODO(STENCIL-854): Remove code related to legacy shadowDomShim field
  if (b.shadowDomShim) {
    b.slotRelocation = b.slot;
  }
  if (config.hydratedFlag) {
    b.hydratedAttribute = config.hydratedFlag.selector === 'attribute';
    b.hydratedClass = config.hydratedFlag.selector === 'class';
    b.hydratedSelectorName = config.hydratedFlag.name;
  } else {
    b.hydratedAttribute = false;
    b.hydratedClass = false;
  }
};
