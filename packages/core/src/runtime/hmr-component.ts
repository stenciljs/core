import * as d from '@stencil/core';
import { BUILD } from 'virtual:app-data';
import { addHostEventListeners, forceUpdate, getHostRef } from 'virtual:platform';

import { HOST_FLAGS } from '../utils/constants';
import { initializeComponent } from './initialize-component';

/**
 * Kick off hot-module-replacement for a component. In order to replace the
 * component in-place we:
 *
 * 1. get a reference to the {@link d.HostRef} for the element
 * 2. reset the element's runtime flags
 * 3. re-run the initialization logic for the element (via
 *    {@link initializeComponent})
 *
 * For standalone (non-lazy) builds, we instead re-import the component module
 * and patch the prototype of the registered constructor in-place, then
 * force a re-render of all existing instances in the DOM.
 *
 * @param hostElement the host element for the component which we want to start
 * doing HMR
 * @param cmpMeta runtime metadata for the component
 * @param hmrVersionId the current HMR version ID
 */
export const hmrStart = (
  hostElement: d.HostElement,
  cmpMeta: d.ComponentRuntimeMeta,
  hmrVersionId: string,
) => {
  if (BUILD.lazyLoad) {
    // Lazy-loaded build: reset flags and re-initialize (existing behavior)
    const hostRef = getHostRef(hostElement);
    if (!hostRef) {
      return;
    }

    // reset state flags to only have been connected
    hostRef.$flags$ = HOST_FLAGS.hasConnected;

    // detach any event listeners that may have been added
    if (BUILD.hostListener && hostRef.$rmListeners$) {
      hostRef.$rmListeners$.map((rmListener) => rmListener());
      hostRef.$rmListeners$ = undefined;
    }

    // re-initialize the component
    initializeComponent(hostElement, hostRef, cmpMeta, hmrVersionId);
  } else {
    // Standalone build: re-import the module and patch the constructor prototype,
    // then re-connect all existing instances in the DOM.
    hmrStandalone(hostElement, cmpMeta, hmrVersionId);
  }
};

const hmrStandalone = async (
  hostElement: d.HostElement,
  cmpMeta: d.ComponentRuntimeMeta,
  hmrVersionId: string,
) => {
  const modulePath: string | undefined = (hostElement.constructor as any).__stencil_module__;
  console.log(`[Stencil HMR] hmrStandalone <${cmpMeta.$tagName$}> modulePath:`, modulePath);
  if (!modulePath) {
    console.warn(
      `[Stencil HMR] No __stencil_module__ on <${cmpMeta.$tagName$}> constructor — was this built with devMode?`,
    );
    return;
  }

  try {
    // Re-import with cache-bust query string so the browser fetches the updated file
    const newModule = await import(
      /* @vite-ignore */
      `${modulePath}?s-hmr=${hmrVersionId}`
    );

    // Find the updated class — prefer a named export whose `.is` tag matches,
    // fall back to the default export
    const NewClass: any =
      Object.values(newModule).find(
        (v: any) => typeof v === 'function' && v.is === cmpMeta.$tagName$,
      ) ?? newModule.default;

    if (!NewClass) {
      return;
    }

    // Patch the registered constructor prototype in-place so all existing
    // instances pick up the new render/lifecycle methods.
    // Object.assign is intentionally NOT used here — class methods are
    // non-enumerable and would be silently skipped.
    const ctor = customElements.get(cmpMeta.$tagName$) as any;

    if (ctor) {
      for (const key of Object.getOwnPropertyNames(NewClass.prototype)) {
        if (key === 'constructor') continue;
        Object.defineProperty(
          ctor.prototype,
          key,
          Object.getOwnPropertyDescriptor(NewClass.prototype, key)!,
        );
      }
    }

    // Force a re-render on all live instances
    const instances = document.querySelectorAll(cmpMeta.$tagName$);
    instances.forEach((el) => {
      if (BUILD.hostListener) {
        const hostRef = getHostRef(el as any);
        if (hostRef?.$rmListeners$) {
          hostRef.$rmListeners$.map((rmListener) => rmListener());
          hostRef.$rmListeners$ = undefined;
          // Re-attach listeners with new handler references
          addHostEventListeners(el as any, hostRef, cmpMeta.$listeners$);
        }
      }
      forceUpdate(el);
    });
  } catch (e) {
    console.error(`[Stencil HMR] Failed to reload <${cmpMeta.$tagName$}>`, e);
  }
};
