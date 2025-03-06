import { BUILD } from '@app-data';
import { reWireGetterSetter } from '@utils/es2022-rewire-class-members';

import type * as d from '../../declarations';

let customError: d.ErrorHandler;

export const cmpModules = new Map<string, { [exportName: string]: d.ComponentConstructor }>();

const getModule = (tagName: string): d.ComponentConstructor | null => {
  if (typeof tagName === 'string') {
    tagName = tagName.toLowerCase();
    const cmpModule = cmpModules.get(tagName);
    if (cmpModule != null) {
      return cmpModule[tagName];
    }
  }
  return null;
};

export const loadModule = (
  cmpMeta: d.ComponentRuntimeMeta,
  _hostRef: d.HostRef,
  _hmrVersionId?: string,
): d.ComponentConstructor | null => {
  return getModule(cmpMeta.$tagName$);
};

export const isMemberInElement = (elm: any, memberName: string) => {
  if (elm != null) {
    if (memberName in elm) {
      return true;
    }
    const cstr = getModule(elm.nodeName);
    if (cstr != null) {
      const hostRef: d.ComponentNativeConstructor = cstr as any;
      if (hostRef != null && hostRef.cmpMeta != null && hostRef.cmpMeta.$members$ != null) {
        return memberName in hostRef.cmpMeta.$members$;
      }
    }
  }
  return false;
};

export const registerComponents = (Cstrs: d.ComponentNativeConstructor[]) => {
  for (const Cstr of Cstrs) {
    // using this format so it follows exactly how client-side modules work
    const exportName = Cstr.cmpMeta.$tagName$;
    cmpModules.set(exportName, {
      [exportName]: Cstr,
    });
  }
};

export const win = window;

export const readTask = (cb: Function) => {
  nextTick(() => {
    try {
      cb();
    } catch (e) {
      consoleError(e);
    }
  });
};

export const writeTask = (cb: Function) => {
  nextTick(() => {
    try {
      cb();
    } catch (e) {
      consoleError(e);
    }
  });
};

const resolved = /*@__PURE__*/ Promise.resolve();
export const nextTick = (cb: () => void) => resolved.then(cb);

const defaultConsoleError = (e: any) => {
  if (e != null) {
    console.error(e.stack || e.message || e);
  }
};

export const consoleError: d.ErrorHandler = (e: any, el?: any) => (customError || defaultConsoleError)(e, el);

export const consoleDevError = (..._: any[]) => {
  /* noop for hydrate */
};

export const consoleDevWarn = (..._: any[]) => {
  /* noop for hydrate */
};

export const consoleDevInfo = (..._: any[]) => {
  /* noop for hydrate */
};

export const setErrorHandler = (handler: d.ErrorHandler) => (customError = handler);

export const plt: d.PlatformRuntime = {
  $flags$: 0,
  $resourcesUrl$: '',
  jmp: (h) => h(),
  raf: (h) => requestAnimationFrame(h),
  ael: (el, eventName, listener, opts) => el.addEventListener(eventName, listener, opts),
  rel: (el, eventName, listener, opts) => el.removeEventListener(eventName, listener, opts),
  ce: (eventName, opts) => new win.CustomEvent(eventName, opts),
};

export const setPlatformHelpers = (helpers: {
  jmp?: (c: any) => any;
  raf?: (c: any) => number;
  ael?: (el: any, eventName: string, listener: any, options: any) => void;
  rel?: (el: any, eventName: string, listener: any, options: any) => void;
  ce?: (eventName: string, opts?: any) => any;
}) => {
  Object.assign(plt, helpers);
};

export const supportsShadow = BUILD.shadowDom;

export const supportsListenerOptions = false;

export const supportsConstructableStylesheets = false;

export const getHostRef = (ref: d.RuntimeRef) => {
  if (ref.__stencil__getHostRef) {
    return ref.__stencil__getHostRef();
  }

  return undefined;
};

export const registerInstance = (lazyInstance: any, hostRef: d.HostRef) => {
  lazyInstance.__stencil__getHostRef = () => hostRef;
  hostRef.$lazyInstance$ = lazyInstance;

  if (BUILD.modernPropertyDecls && (BUILD.state || BUILD.prop)) {
    reWireGetterSetter(lazyInstance, hostRef);
  }
  return hostRef;
};

export const registerHost = (elm: d.HostElement, cmpMeta: d.ComponentRuntimeMeta) => {
  const hostRef: d.HostRef = {
    $flags$: 0,
    $cmpMeta$: cmpMeta,
    $hostElement$: elm,
    $instanceValues$: new Map(),
    $renderCount$: 0,
  };
  hostRef.$onInstancePromise$ = new Promise((r) => (hostRef.$onInstanceResolve$ = r));
  hostRef.$onReadyPromise$ = new Promise((r) => (hostRef.$onReadyResolve$ = r));
  elm['s-p'] = [];
  elm['s-rc'] = [];
  elm.__stencil__getHostRef = () => hostRef;

  return hostRef;
};

export const Build: d.UserBuildConditionals = {
  isDev: false,
  isBrowser: false,
  isServer: true,
  isTesting: false,
};

export const styles: d.StyleMap = new Map();
export const modeResolutionChain: d.ResolutionHandler[] = [];

export { hAsync as h } from './h-async';
export { hydrateApp } from './hydrate-app';
export { BUILD, Env, NAMESPACE } from '@app-data';
export {
  addHostEventListeners,
  bootstrapLazy,
  connectedCallback,
  createEvent,
  defineCustomElement,
  disconnectedCallback,
  forceModeUpdate,
  forceUpdate,
  Fragment,
  getAssetPath,
  getElement,
  getMode,
  getRenderingRef,
  getValue,
  Host,
  insertVdomAnnotations,
  parsePropertyValue,
  postUpdateComponent,
  proxyComponent,
  proxyCustomElement,
  renderVdom,
  setAssetPath,
  setMode,
  setNonce,
  setValue,
} from '@runtime';
