import type * as d from '../../declarations';

export const CREATE_EVENT = '__stencil_createEvent';
export const DEFINE_CUSTOM_ELEMENT = '__stencil_defineCustomElement';
export const GET_ELEMENT = '__stencil_getElement';
export const HOST = '__stencil_Host';
export const HTML_ELEMENT = 'HTMLElement';
export const PROXY_CUSTOM_ELEMENT = '__stencil_proxyCustomElement';
export const REGISTER_INSTANCE = '__stencil_registerInstance';
export const REGISTER_HOST = '__stencil_registerHost';
export const H = '__stencil_h';

export const RUNTIME_APIS = {
  createEvent: `createEvent as ${CREATE_EVENT}`,
  defineCustomElement: `defineCustomElement as ${DEFINE_CUSTOM_ELEMENT}`,
  getElement: `getElement as ${GET_ELEMENT}`,
  h: `h as ${H}`,
  legacyH: `h`,
  Host: `Host as ${HOST}`,
  HTMLElement: HTML_ELEMENT,
  proxyCustomElement: `proxyCustomElement as ${PROXY_CUSTOM_ELEMENT}`,
  registerHost: `registerHost as ${REGISTER_HOST}`,
  registerInstance: `registerInstance as ${REGISTER_INSTANCE}`,
};

/**
 * Update a Stencil Module entity to include a {@link RUNTIME_APIS} entry if it does not already exist.
 * This allows Stencil to keep `moduleFile` easily serializable, where this helper function treats the data structure
 * that stores {@link d.Module#coreRuntimeApis} similar to a JS `Set`.
 * @param moduleFile the Module entity to update
 * @param coreRuntimeApi the API to add to the provided module
 */
export const addCoreRuntimeApi = (moduleFile: d.Module, coreRuntimeApi: string): void => {
  if (!moduleFile.coreRuntimeApis.includes(coreRuntimeApi)) {
    moduleFile.coreRuntimeApis.push(coreRuntimeApi);
  }
};

/**
 * Update a Stencil Module entity to include a {@link RUNTIME_APIS} entry for a specific output target, if it does not
 * already exist.
 * This allows Stencil to keep `moduleFile` easily serializable, where this helper function treats the data structure
 * that stores {@link d.Module#outputTargetCoreRuntimeApis} similar to a JS `Set`.
 * @param moduleFile the Module entity to update
 * @param outputTarget the output target to assign the provided runtime api under
 * @param coreRuntimeApi the API to add to the provided module
 */
export const addOutputTargetCoreRuntimeApi = (
  moduleFile: d.Module,
  outputTarget: d.OutputTarget['type'],
  coreRuntimeApi: string,
): void => {
  if (!moduleFile.outputTargetCoreRuntimeApis[outputTarget]) {
    // no such output target-specific collection exists, create the empty collection
    moduleFile.outputTargetCoreRuntimeApis[outputTarget] = [];
  }

  if (!moduleFile.outputTargetCoreRuntimeApis[outputTarget].includes(coreRuntimeApi)) {
    // add the api to the collection
    moduleFile.outputTargetCoreRuntimeApis[outputTarget].push(coreRuntimeApi);
  }
};

export const addLegacyApis = (moduleFile: d.Module) => {
  addCoreRuntimeApi(moduleFile, RUNTIME_APIS.legacyH);
};
