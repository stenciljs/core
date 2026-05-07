import { BUILD } from 'virtual:app-data';
import type * as d from '@stencil/core';

import { CMP_FLAGS } from '../utils/constants';
import { reWireGetterSetter } from '../utils/es2022-rewire-class-members';

/**
 * Given a {@link d.RuntimeRef} retrieve the corresponding {@link d.HostRef}
 *
 * @param ref the runtime ref of interest
 * @returns the Host reference (if found) or undefined
 */
export const getHostRef = (ref: d.RuntimeRef): d.HostRef | undefined => {
  if (ref.__s_ghr) {
    return ref.__s_ghr();
  }

  return undefined;
};

/**
 * Register a lazy instance with the {@link hostRefs} object so it's
 * corresponding {@link d.HostRef} can be retrieved later.
 *
 * @param lazyInstance the lazy instance of interest
 * @param hostRef that instances `HostRef` object
 */
export const registerInstance = (lazyInstance: any, hostRef: d.HostRef) => {
  if (!hostRef) return;
  lazyInstance.__s_ghr = () => hostRef;
  hostRef.$lazyInstance$ = lazyInstance;

  if (hostRef.$cmpMeta$.$flags$ & CMP_FLAGS.hasModernPropertyDecls && (BUILD.state || BUILD.prop)) {
    reWireGetterSetter(lazyInstance, hostRef);
  }
};

/**
 * Register a host element for a Stencil component, setting up various metadata
 * and callbacks based on {@link BUILD} flags as well as the component's runtime
 * metadata.
 *
 * @param hostElement the host element to register
 * @param cmpMeta runtime metadata for that component
 * @returns a reference to the host ref WeakMap
 */
export const registerHost = (hostElement: d.HostElement, cmpMeta: d.ComponentRuntimeMeta) => {
  const hostRef: d.HostRef = {
    $flags$: 0,
    $hostElement$: hostElement,
    $cmpMeta$: cmpMeta,
    $instanceValues$: new Map(),
    $serializerValues$: new Map(),
  };
  if (BUILD.isDev) {
    hostRef.$renderCount$ = 0;
  }
  if (BUILD.method && BUILD.lazyLoad) {
    hostRef.$onInstancePromise$ = new Promise((r) => (hostRef.$onInstanceResolve$ = r));
  }
  if (BUILD.asyncLoading) {
    hostRef.$onReadyPromise$ = new Promise((r) => (hostRef.$onReadyResolve$ = r));
    // Expose the ready promise on the element itself under a stable string key
    // ('s-rp') so the autoloader can access it without going through the
    // minified hostRef internals
    hostElement['s-rp'] = hostRef.$onReadyPromise$;
    // Preserve any existing s-p/s-rc arrays (e.g. pre-set by the autoloader
    // before this element was upgraded) so that promises pushed by children
    // that connected before this element's constructor ran are not lost.
    if (!hostElement['s-p']) hostElement['s-p'] = [];
    if (!hostElement['s-rc']) hostElement['s-rc'] = [];
  }
  if (BUILD.lazyLoad) {
    hostRef.$fetchedCbList$ = [];
  }

  const ref = hostRef;
  hostElement.__s_ghr = () => ref;

  if (
    !BUILD.lazyLoad &&
    cmpMeta.$flags$ & CMP_FLAGS.hasModernPropertyDecls &&
    (BUILD.state || BUILD.prop)
  ) {
    reWireGetterSetter(hostElement, hostRef);
  }

  return ref;
};

export const isMemberInElement = (elm: any, memberName: string) => memberName in elm;
