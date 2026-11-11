import { BUILD } from 'virtual:app-data';
import { getHostRef, nextTick, plt, registerHost, transformTag, win } from 'virtual:platform';

import { CMP_FLAGS } from '../utils/constants';
import { queryNonceMetaTagContent } from '../utils/query-nonce-meta-tag-content';
import { createShadowRoot } from '../utils/shadow-root';
import { connectedCallback } from './connected-callback';
import { disconnectedCallback } from './disconnected-callback';
import {
  applyLightDomPatches,
  patchChildSlotNodes,
  patchCloneNode,
  patchInsertBefore,
  patchSlotAppend,
  patchSlotAppendChild,
  patchSlotInsertAdjacentHTML,
  patchSlotPrepend,
  patchSlotRemoveChild,
  patchInnerContentSetters,
  patchTextContent,
} from './dom-extras';
import { getShadowRoot } from './element';
import { hmrStart } from './hmr-component';
import { normalizeWatchers } from './normalize-watchers';
import { deferUntilParsed, mayStillBeParsing } from './parse-gate';
import { createTime, installDevTools } from './profile';
import { proxyComponent } from './proxy-component';
import { HYDRATED_CSS, PLATFORM_FLAGS, PROXY_FLAGS } from './runtime-constants';
import { hydrateScopedToShadow } from './styles';
import { appDidLoad } from './update-component';
import { addHostEventListeners } from '.';
import type * as d from '../declarations';
export { setNonce } from 'virtual:platform';
export { setRegistry } from './registry';
import { getRegistry } from './registry';

export const bootstrapLazy = (
  lazyBundles: d.LazyBundlesRuntimeData,
  options: d.CustomElementsDefineOptions = {},
) => {
  if (BUILD.profile && performance.mark) {
    performance.mark('st:app:start');
  }
  installDevTools();

  if (!win.document) {
    console.warn('Stencil: No document found. Skipping');
    return;
  }

  const endBootstrap = createTime('bootstrapLazy');
  const cmpTags: string[] = [];
  const exclude = options.exclude || [];
  const _reg: CustomElementRegistry = options.registry ?? getRegistry();
  const head = win.document.head;
  const metaCharset = /*@__PURE__*/ head.querySelector('meta[charset]');
  const dataStyles = /*@__PURE__*/ win.document.createElement('style');
  const deferredConnectedCallbacks: { connectedCallback: () => void }[] = [];
  let appLoadFallback: any;
  let isBootstrapping = true;

  Object.assign(plt, options);
  if (BUILD.asyncQueue && options.syncQueue) {
    plt.$flags$ |= PLATFORM_FLAGS.queueSync;
  }
  if (BUILD.hydrateClientSide) {
    // If the app is already hydrated there is not point to disable the
    // async queue. This will improve the first input delay
    plt.$flags$ |= PLATFORM_FLAGS.appLoaded;
  }

  if (BUILD.hydrateClientSide && BUILD.shadowDom) {
    const cmpMetas: Pick<d.ComponentRuntimeMeta, '$flags$' | '$tagName$'>[] = [];
    lazyBundles.map((lazyBundle) =>
      lazyBundle[1].map(([$flags$, $tagName$]) => cmpMetas.push({ $flags$, $tagName$ })),
    );
    hydrateScopedToShadow(cmpMetas);
  }

  lazyBundles.map((lazyBundle) => {
    lazyBundle[1].map((compactMeta) => {
      const cmpMeta: d.ComponentRuntimeMeta = {
        $flags$: compactMeta[0],
        $tagName$: compactMeta[1],
        $members$: compactMeta[2],
        $listeners$: compactMeta[3],
      };

      if (BUILD.member) {
        cmpMeta.$members$ = compactMeta[2];
      }
      if (BUILD.hostListener) {
        cmpMeta.$listeners$ = compactMeta[3];
      }
      if (BUILD.reflect) {
        cmpMeta.$attrsToReflect$ = [];
      }
      if (BUILD.propChangeCallback) {
        // Watchers need normalization because the compiler format changed in
        // 4.39.x (string[] → { [method]: flags }[]). Libraries compiled with
        // an older Stencil may still emit the legacy format. Serializers and
        // deserializers were introduced after that change, so their format is
        // always current and only needs a nullish fallback.
        cmpMeta.$watchers$ = normalizeWatchers(compactMeta[4]);
        cmpMeta.$serializers$ = compactMeta[5] ?? {};
        cmpMeta.$deserializers$ = compactMeta[6] ?? {};
      }
      if (BUILD.shadowReferenceTarget) {
        cmpMeta.$referenceTarget$ = compactMeta[7];
      }
      const tagName = transformTag(cmpMeta.$tagName$);
      const attachShadowRoot = (elm: HTMLElement) => {
        if (
          cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation &&
          !(cmpMeta.$flags$ & CMP_FLAGS.shadowNeedsScopedCss) &&
          !getShadowRoot(elm)
        ) {
          createShadowRoot.call(elm, cmpMeta);
        }
      };
      const HostElement = class extends HTMLElement {
        ['s-p']: Promise<void>[];
        ['s-rc']: (() => void)[];
        // has registered event listeners for this instance
        hreListeners = false;

        // StencilLazyHost
        constructor(self: HTMLElement) {
          // @ts-ignore
          super(self);
          self = this;

          registerHost(self, cmpMeta);
          // Attach now so ancestors hydrating before this connects see the shadow root -
          // unless the parser may still be streaming in a declarative one.
          if (BUILD.shadowDom && !(BUILD.hydrateClientSide && mayStillBeParsing(self))) {
            attachShadowRoot(self);
          }
        }

        connectedCallback() {
          const hostRef = getHostRef(this);
          if (!hostRef) {
            return;
          }
          // attaching a shadow root before a streamed host's declarative one is parsed
          // makes the parser reject it
          if (BUILD.hydrateClientSide && deferUntilParsed(this)) {
            return;
          }
          if (BUILD.shadowDom) attachShadowRoot(this);

          /**
           * The `connectedCallback` lifecycle event can potentially be fired multiple times
           * if the element is removed from the DOM and re-inserted. This is not a common use case,
           * but it can happen in some scenarios. To prevent registering the same event listeners
           * multiple times, we will only register them once.
           */
          if (!this.hreListeners) {
            this.hreListeners = true;
            addHostEventListeners(this, hostRef, cmpMeta.$listeners$);
          }

          if (appLoadFallback) {
            clearTimeout(appLoadFallback);
            appLoadFallback = null;
          }
          if (isBootstrapping) {
            // connectedCallback will be processed once all components have been registered
            deferredConnectedCallbacks.push(this);
          } else {
            plt.jmp(() => connectedCallback(this));
          }
        }

        disconnectedCallback() {
          plt.jmp(() => disconnectedCallback(this));

          /**
           * Clear up references within the `$vnode$` object to the DOM
           * node that was removed. This is necessary to ensure that these
           * references used as keys in the `hostRef` object can be properly
           * garbage collected.
           *
           * Also remove the reference from `deferredConnectedCallbacks` array
           * otherwise removed instances won't get garbage collected.
           *
           * Use `nextTick` (microtask) rather than `plt.raf` since
           * `requestAnimationFrame` callbacks do not fire while `document.hidden`
           */
          nextTick(() => {
            const hostRef = getHostRef(this);
            if (!hostRef) {
              return;
            }
            const i = deferredConnectedCallbacks.findIndex((host) => host === this);
            if (i > -1) {
              deferredConnectedCallbacks.splice(i, 1);
            }
            if (hostRef?.$vnode$?.$elm$ instanceof Node && !hostRef.$vnode$.$elm$.isConnected) {
              delete hostRef.$vnode$.$elm$;
            }
          });
        }

        componentOnReady() {
          return getHostRef(this)?.$onReadyPromise$;
        }
      };

      // patchCloneNode applies to all non-shadow components, not just those with slots
      if (
        !(cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation) &&
        (BUILD.slotCloneNode || (BUILD.patchClone && cmpMeta.$flags$ & CMP_FLAGS.patchClone))
      ) {
        patchCloneNode(HostElement.prototype);
      }

      if (
        !(cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation) &&
        cmpMeta.$flags$ & CMP_FLAGS.hasSlot
      ) {
        // 'all' path: global lightDomPatches:true or per-component patchAll flag
        if (BUILD.lightDomPatches || (BUILD.patchAll && cmpMeta.$flags$ & CMP_FLAGS.patchAll)) {
          applyLightDomPatches(HostElement.prototype);
        } else {
          // Individual patches via global BUILD flags OR per-component flags
          if (
            BUILD.slotChildNodes ||
            (BUILD.patchChildren && cmpMeta.$flags$ & CMP_FLAGS.patchChildren)
          ) {
            patchChildSlotNodes(HostElement.prototype);
          }
          if (
            BUILD.slotDomMutations ||
            (BUILD.patchInsert && cmpMeta.$flags$ & CMP_FLAGS.patchInsert)
          ) {
            patchSlotAppendChild(HostElement.prototype);
            patchSlotAppend(HostElement.prototype);
            patchSlotPrepend(HostElement.prototype);
            patchSlotInsertAdjacentHTML(HostElement.prototype);
            patchInsertBefore(HostElement.prototype);
            patchSlotRemoveChild(HostElement.prototype);
            patchInnerContentSetters(HostElement.prototype);
          }
          if (BUILD.slotTextContent) {
            patchTextContent(HostElement.prototype);
          }
        }
      }

      if (BUILD.hydrateClientSide && BUILD.shadowDom) {
        // called by the parse gate once a held host's subtree is parsed
        (HostElement.prototype as d.HostElement).__attachShadow = function (this: HTMLElement) {
          attachShadowRoot(this);
        };
      }

      // if the component is formAssociated we need to set that on the host
      // element so that it will be ready for `attachInternals` to be called on
      // it later on
      if (BUILD.formAssociated && cmpMeta.$flags$ & CMP_FLAGS.formAssociated) {
        (HostElement as any).formAssociated = true;
      }

      if (BUILD.hotModuleReplacement) {
        // if we're in an HMR dev build then we need to set up the callback
        // which will carry out the work of actually replacing the module for
        // this particular component
        ((HostElement as any).prototype as d.HostElement)['s-hmr'] = function (
          hmrVersionId: string,
        ) {
          hmrStart(this, cmpMeta, hmrVersionId);
        };
      }

      cmpMeta.$lazyBundleId$ = lazyBundle[0];

      if (!exclude.includes(tagName) && !_reg.get(tagName)) {
        cmpTags.push(tagName);
        const proxied = proxyComponent(
          HostElement as any,
          cmpMeta,
          PROXY_FLAGS.isElementConstructor,
        ) as any;
        proxied._registry = _reg;
        _reg.define(tagName, proxied);
      }
    });
  });

  // Only bother generating CSS if we have components
  if (cmpTags.length > 0) {
    // Add hydration styles
    if (
      BUILD.invisiblePrehydration &&
      !BUILD.staticHydrationStyles &&
      (BUILD.hydratedClass || BUILD.hydratedAttribute)
    ) {
      dataStyles.textContent += cmpTags.sort() + HYDRATED_CSS;
    }

    // If we have styles, add them to the DOM
    if (dataStyles.innerHTML.length) {
      dataStyles.setAttribute('data-styles', '');

      // Apply CSP nonce to the style tag if it exists
      const nonce = plt.$nonce$ ?? queryNonceMetaTagContent(win.document);
      if (nonce != null) {
        dataStyles.setAttribute('nonce', nonce);
      }

      // Insert the styles into the document head
      // NOTE: this _needs_ to happen last so we can ensure the nonce (and other attributes) are applied
      head.insertBefore(dataStyles, metaCharset ? metaCharset.nextSibling : head.firstChild);
    }
  }

  // Process deferred connectedCallbacks now all components have been registered
  isBootstrapping = false;
  if (deferredConnectedCallbacks.length) {
    deferredConnectedCallbacks.map((host) => host.connectedCallback());
  } else {
    if (BUILD.profile) {
      plt.jmp(() => (appLoadFallback = setTimeout(appDidLoad, 30, 'timeout')));
    } else {
      plt.jmp(() => (appLoadFallback = setTimeout(appDidLoad, 30)));
    }
  }
  // Fallback appLoad event
  endBootstrap();
};
