import { BUILD } from 'virtual:app-data';
import { getHostRef, plt, registerHost, transformTag, win } from 'virtual:platform';

import { CMP_FLAGS } from '../utils/constants';
import { queryNonceMetaTagContent } from '../utils/query-nonce-meta-tag-content';
import { createShadowRoot } from '../utils/shadow-root';
import { connectedCallback } from './connected-callback';
import { disconnectedCallback } from './disconnected-callback';
import {
  patchChildSlotNodes,
  patchCloneNode,
  patchInsertBefore,
  patchPseudoShadowDom,
  patchSlotAppendChild,
  patchSlotRemoveChild,
  patchTextContent,
} from './dom-extras';
import { hmrStart } from './hmr-component';
import { normalizeWatchers } from './normalize-watchers';
import { createTime, installDevTools } from './profile';
import { proxyComponent } from './proxy-component';
import { HYDRATED_CSS, PLATFORM_FLAGS, PROXY_FLAGS } from './runtime-constants';
import { hydrateScopedToShadow } from './styles';
import { appDidLoad } from './update-component';
import { addHostEventListeners } from '.';
import type * as d from '../declarations';
export { setNonce } from 'virtual:platform';

export const bootstrapLazy = (
  lazyBundles: d.LazyBundlesRuntimeData,
  options: d.CustomElementsDefineOptions = {},
) => {
  if (BUILD.profile && performance.mark) {
    performance.mark('st:app:start');
  }
  installDevTools();

  if (!win.document) {
    console.warn('Stencil: No document found. Skipping bootstrapping lazy components.');
    return;
  }

  const endBootstrap = createTime('bootstrapLazy');
  const cmpTags: string[] = [];
  const exclude = options.exclude || [];
  const customElements = win.customElements;
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
    hydrateScopedToShadow();
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
      const tagName = transformTag(cmpMeta.$tagName$);
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
          if (
            BUILD.shadowDom &&
            cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation &&
            !(cmpMeta.$flags$ & CMP_FLAGS.shadowNeedsScopedCss)
          ) {
            // this component is using shadow dom
            // add the read-only property "shadowRoot" to the host element
            // adding the shadow root build conditionals to minimize runtime

            if (!self.shadowRoot) {
              // we don't want to call `attachShadow` if there's already a shadow root
              // attached to the component
              createShadowRoot.call(self, cmpMeta);
            } else if (BUILD.isDev && self.shadowRoot.mode !== 'open') {
              throw new Error(
                `Unable to re-use existing shadow root for ${cmpMeta.$tagName$}! Mode is set to ${self.shadowRoot.mode} but DSD shadow roots must use open mode.`,
              );
            }
          }
        }

        connectedCallback() {
          const hostRef = getHostRef(this);
          if (!hostRef) {
            return;
          }

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
           */
          plt.raf(() => {
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

      if (
        !(cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation) &&
        cmpMeta.$flags$ & CMP_FLAGS.hasSlot
      ) {
        // 'all' path: global lightDomPatches:true or per-component patchAll flag
        if (BUILD.lightDomPatches || (BUILD.patchAll && cmpMeta.$flags$ & CMP_FLAGS.patchAll)) {
          patchPseudoShadowDom(HostElement.prototype);
        } else {
          // Individual patches via global BUILD flags OR per-component flags
          if (
            BUILD.slotChildNodes ||
            (BUILD.patchChildren && cmpMeta.$flags$ & CMP_FLAGS.patchChildren)
          ) {
            patchChildSlotNodes(HostElement.prototype);
          }
          if (BUILD.slotCloneNode || (BUILD.patchClone && cmpMeta.$flags$ & CMP_FLAGS.patchClone)) {
            patchCloneNode(HostElement.prototype);
          }
          if (
            BUILD.slotDomMutations ||
            (BUILD.patchInsert && cmpMeta.$flags$ & CMP_FLAGS.patchInsert)
          ) {
            patchSlotAppendChild(HostElement.prototype);
            patchInsertBefore(HostElement.prototype);
            patchSlotRemoveChild(HostElement.prototype);
          }
          if (BUILD.slotTextContent && cmpMeta.$flags$ & CMP_FLAGS.scopedCssEncapsulation) {
            patchTextContent(HostElement.prototype);
          }
        }
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

      if (!exclude.includes(tagName) && !customElements.get(tagName)) {
        cmpTags.push(tagName);
        customElements.define(
          tagName,
          proxyComponent(HostElement as any, cmpMeta, PROXY_FLAGS.isElementConstructor) as any,
        );
      }
    });
  });

  // Only bother generating CSS if we have components
  if (cmpTags.length > 0) {
    // Add hydration styles
    if (BUILD.invisiblePrehydration && (BUILD.hydratedClass || BUILD.hydratedAttribute)) {
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
