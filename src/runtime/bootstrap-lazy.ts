import { BUILD } from '@app-data';
import { getHostRef, plt, registerHost, supportsShadow, win } from '@platform';
import { addHostEventListeners } from '@runtime';
import { CMP_FLAGS, queryNonceMetaTagContent } from '@utils';

import type * as d from '../declarations';
import { connectedCallback } from './connected-callback';
import { disconnectedCallback } from './disconnected-callback';
import {
  patchChildSlotNodes,
  patchCloneNode,
  patchPseudoShadowDom,
  patchSlotAppendChild,
  patchTextContent,
} from './dom-extras';
import { hmrStart } from './hmr-component';
import { createTime, installDevTools } from './profile';
import { proxyComponent } from './proxy-component';
import { HYDRATED_CSS, PLATFORM_FLAGS, PROXY_FLAGS, SLOT_FB_CSS } from './runtime-constants';
import { hydrateScopedToShadow } from './styles';
import { appDidLoad } from './update-component';
export { setNonce } from '@platform';

export const bootstrapLazy = (lazyBundles: d.LazyBundlesRuntimeData, options: d.CustomElementsDefineOptions = {}) => {
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
  plt.$resourcesUrl$ = new URL(options.resourcesUrl || './', win.document.baseURI).href;
  if (BUILD.asyncQueue) {
    if (options.syncQueue) {
      plt.$flags$ |= PLATFORM_FLAGS.queueSync;
    }
  }
  if (BUILD.hydrateClientSide) {
    // If the app is already hydrated there is not point to disable the
    // async queue. This will improve the first input delay
    plt.$flags$ |= PLATFORM_FLAGS.appLoaded;
  }

  if (BUILD.hydrateClientSide && BUILD.shadowDom) {
    hydrateScopedToShadow();
  }

  let hasSlotRelocation = false;
  lazyBundles.map((lazyBundle) => {
    lazyBundle[1].map((compactMeta) => {
      const cmpMeta: d.ComponentRuntimeMeta = {
        $flags$: compactMeta[0],
        $tagName$: compactMeta[1],
        $members$: compactMeta[2],
        $listeners$: compactMeta[3],
      };

      // Check if we are using slots outside the shadow DOM in this component.
      // We'll use this information later to add styles for `slot-fb` elements
      if (cmpMeta.$flags$ & CMP_FLAGS.hasSlotRelocation) {
        hasSlotRelocation = true;
      }

      if (BUILD.member) {
        cmpMeta.$members$ = compactMeta[2];
      }
      if (BUILD.hostListener) {
        cmpMeta.$listeners$ = compactMeta[3];
      }
      if (BUILD.reflect) {
        cmpMeta.$attrsToReflect$ = [];
      }
      if (BUILD.watchCallback) {
        cmpMeta.$watchers$ = compactMeta[4] ?? {};
      }
      if (BUILD.shadowDom && !supportsShadow && cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation) {
        // TODO(STENCIL-854): Remove code related to legacy shadowDomShim field
        cmpMeta.$flags$ |= CMP_FLAGS.needsShadowDomShim;
      }
      const tagName =
        BUILD.transformTagName && options.transformTagName
          ? options.transformTagName(cmpMeta.$tagName$)
          : cmpMeta.$tagName$;
      const HostElement = class extends HTMLElement {
        ['s-p']: Promise<void>[];
        ['s-rc']: (() => void)[];
        hasRegisteredEventListeners = false;

        // StencilLazyHost
        constructor(self: HTMLElement) {
          // @ts-ignore
          super(self);
          self = this;

          registerHost(self, cmpMeta);
          if (BUILD.shadowDom && cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation) {
            // this component is using shadow dom
            // and this browser supports shadow dom
            // add the read-only property "shadowRoot" to the host element
            // adding the shadow root build conditionals to minimize runtime
            if (supportsShadow) {
              if (!self.shadowRoot) {
                // we don't want to call `attachShadow` if there's already a shadow root
                // attached to the component
                if (BUILD.shadowDelegatesFocus) {
                  self.attachShadow({
                    mode: 'open',
                    delegatesFocus: !!(cmpMeta.$flags$ & CMP_FLAGS.shadowDelegatesFocus),
                  });
                } else {
                  self.attachShadow({ mode: 'open' });
                }
              } else {
                // we want to check to make sure that the mode for the shadow
                // root already attached to the element (i.e. created via DSD)
                // is set to 'open' since that's the only mode we support
                if (self.shadowRoot.mode !== 'open') {
                  throw new Error(
                    `Unable to re-use existing shadow root for ${cmpMeta.$tagName$}! Mode is set to ${self.shadowRoot.mode} but Stencil only supports open shadow roots.`,
                  );
                }
              }
            } else if (!BUILD.hydrateServerSide && !('shadowRoot' in self)) {
              (self as any).shadowRoot = self;
            }
          }
        }

        connectedCallback() {
          const hostRef = getHostRef(this);

          /**
           * The `connectedCallback` lifecycle event can potentially be fired multiple times
           * if the element is removed from the DOM and re-inserted. This is not a common use case,
           * but it can happen in some scenarios. To prevent registering the same event listeners
           * multiple times, we will only register them once.
           */
          if (!this.hasRegisteredEventListeners) {
            this.hasRegisteredEventListeners = true;
            addHostEventListeners(this, hostRef, cmpMeta.$listeners$, false);
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
          return getHostRef(this).$onReadyPromise$;
        }
      };

      // TODO(STENCIL-914): this check and `else` block can go away and be replaced by just the `scoped` check
      if (BUILD.experimentalSlotFixes) {
        // This check is intentionally not combined with the surrounding `experimentalSlotFixes` check
        // since, moving forward, we only want to patch the pseudo shadow DOM when the component is scoped
        if (BUILD.scoped && cmpMeta.$flags$ & CMP_FLAGS.scopedCssEncapsulation) {
          patchPseudoShadowDom(HostElement.prototype);
        }
      } else {
        if (BUILD.slotChildNodesFix) {
          patchChildSlotNodes(HostElement.prototype);
        }
        if (BUILD.cloneNodeFix) {
          patchCloneNode(HostElement.prototype);
        }
        if (BUILD.appendChildSlotFix) {
          patchSlotAppendChild(HostElement.prototype);
        }
        if (BUILD.scopedSlotTextContentFix && cmpMeta.$flags$ & CMP_FLAGS.scopedCssEncapsulation) {
          patchTextContent(HostElement.prototype);
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
        ((HostElement as any).prototype as d.HostElement)['s-hmr'] = function (hmrVersionId: string) {
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
  // TODO(STENCIL-1118): Add test cases for CSS content based on conditionals
  if (cmpTags.length > 0) {
    // Add styles for `slot-fb` elements if any of our components are using slots outside the Shadow DOM
    if (hasSlotRelocation) {
      dataStyles.textContent += SLOT_FB_CSS;
    }

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
