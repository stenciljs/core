import { BUILD } from 'virtual:app-data';
import {
  addHostEventListeners,
  consoleError,
  forceUpdate,
  getHostRef,
  registerHost,
  styles,
  transformTag,
} from 'virtual:platform';
import type * as d from '@stencil/core';

import { CMP_FLAGS } from '../utils/constants';
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
import { computeMode } from './mode';
import { normalizeWatchers } from './normalize-watchers';
import { proxyComponent } from './proxy-component';
import { PROXY_FLAGS } from './runtime-constants';
import { attachStyles, getScopeId, hydrateScopedToShadow, registerStyle } from './styles';

export const defineCustomElement = (Cstr: any, compactMeta: d.ComponentRuntimeMetaCompact) => {
  customElements.define(
    transformTag(compactMeta[1]),
    proxyCustomElement(Cstr, compactMeta) as CustomElementConstructor,
  );
};

export const proxyCustomElement = (Cstr: any, compactMeta: d.ComponentRuntimeMetaCompact) => {
  // Set the app start mark on first component (for consistent profiling with lazy build)
  if (
    BUILD.profile &&
    performance.mark &&
    performance.getEntriesByName('st:app:start', 'mark').length === 0
  ) {
    performance.mark('st:app:start');
  }

  const cmpMeta: d.ComponentRuntimeMeta = {
    $flags$: compactMeta[0],
    $tagName$: compactMeta[1],
  };
  try {
    if (BUILD.member) {
      cmpMeta.$members$ = compactMeta[2];
    }
    if (BUILD.hostListener) {
      cmpMeta.$listeners$ = compactMeta[3];
    }
    if (BUILD.propChangeCallback) {
      cmpMeta.$watchers$ = normalizeWatchers(Cstr.$watchers$);
      cmpMeta.$deserializers$ = Cstr.$deserializers$;
      cmpMeta.$serializers$ = Cstr.$serializers$;
    }
    if (BUILD.reflect) {
      cmpMeta.$attrsToReflect$ = [];
    }

    if (BUILD.hotModuleReplacement) {
      // if we're in an HMR dev build then we need to set up the callback
      // which will carry out the work of actually replacing the module for
      // this particular component
      (Cstr.prototype as d.HostElement)['s-hmr'] = function (hmrVersionId: string) {
        hmrStart(this, cmpMeta, hmrVersionId);
      };
    }

    if (
      !(cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation) &&
      cmpMeta.$flags$ & CMP_FLAGS.hasSlot
    ) {
      // Check for 'all' patches: either global experimentalSlotFixes or per-component patchAll flag
      if (BUILD.experimentalSlotFixes || (BUILD.patchAll && cmpMeta.$flags$ & CMP_FLAGS.patchAll)) {
        patchPseudoShadowDom(Cstr.prototype);
      } else {
        // Apply individual patches based on global BUILD flags OR per-component flags
        if (
          BUILD.slotChildNodesFix ||
          (BUILD.patchChildren && cmpMeta.$flags$ & CMP_FLAGS.patchChildren)
        ) {
          patchChildSlotNodes(Cstr.prototype);
        }
        if (BUILD.cloneNodeFix || (BUILD.patchClone && cmpMeta.$flags$ & CMP_FLAGS.patchClone)) {
          patchCloneNode(Cstr.prototype);
        }
        if (
          BUILD.appendChildSlotFix ||
          (BUILD.patchInsert && cmpMeta.$flags$ & CMP_FLAGS.patchInsert)
        ) {
          patchSlotAppendChild(Cstr.prototype);
          patchInsertBefore(Cstr.prototype);
          patchSlotRemoveChild(Cstr.prototype);
        }
        if (BUILD.scopedSlotTextContentFix && cmpMeta.$flags$ & CMP_FLAGS.scopedCssEncapsulation) {
          patchTextContent(Cstr.prototype);
        }
      }
    } else if (BUILD.cloneNodeFix || (BUILD.patchClone && cmpMeta.$flags$ & CMP_FLAGS.patchClone)) {
      patchCloneNode(Cstr.prototype);
    }

    if (BUILD.hydrateClientSide && BUILD.shadowDom) {
      hydrateScopedToShadow();
    }

    const originalConnectedCallback = Cstr.prototype.connectedCallback;
    const originalDisconnectedCallback = Cstr.prototype.disconnectedCallback;
    Object.assign(Cstr.prototype, {
      __hasHostListenerAttached: false,
      __registerHost(this: d.HostElement) {
        registerHost(this, cmpMeta);
      },
      componentOnReady(this: d.HostElement) {
        return getHostRef(this)?.$onReadyPromise$;
      },
      connectedCallback(this: d.HostElement & { __hasHostListenerAttached: boolean }) {
        if (!this.__hasHostListenerAttached) {
          const hostRef = getHostRef(this);
          if (!hostRef) {
            return;
          }
          addHostEventListeners(this, hostRef, cmpMeta.$listeners$);
          this.__hasHostListenerAttached = true;
        }

        connectedCallback(this);
        if (originalConnectedCallback) {
          originalConnectedCallback.call(this);
        }
      },
      disconnectedCallback(this: d.HostElement) {
        disconnectedCallback(this);
        if (originalDisconnectedCallback) {
          originalDisconnectedCallback.call(this);
        }
      },
      __attachShadow(this: d.HostElement) {
        const isClosed = BUILD.shadowModeClosed && !!(cmpMeta.$flags$ & CMP_FLAGS.shadowModeClosed);

        // For closed shadow roots, this.shadowRoot will be null.
        // Check our stored reference instead.
        let existingRoot: ShadowRoot | null = this.shadowRoot;
        if (BUILD.shadowModeClosed && isClosed) {
          existingRoot = (this as any).__shadowRoot ?? null;
        }

        if (!existingRoot) {
          createShadowRoot.call(this, cmpMeta);
        } else if (
          BUILD.isDev &&
          BUILD.shadowModeClosed &&
          isClosed &&
          existingRoot.mode !== 'closed'
        ) {
          throw new Error(
            `Unable to re-use existing shadow root for ${cmpMeta.$tagName$}! Mode is set to ${existingRoot.mode} but expected closed.`,
          );
        }
      },
    });
    Object.defineProperty(Cstr, 'is', {
      value: cmpMeta.$tagName$,
      configurable: true,
    });

    return proxyComponent(Cstr, cmpMeta, PROXY_FLAGS.isElementConstructor | PROXY_FLAGS.proxyState);
  } catch (e) {
    consoleError(e);
    return Cstr;
  }
};

export const forceModeUpdate = (elm: d.RenderNode) => {
  if (BUILD.style && BUILD.mode && !BUILD.lazyLoad) {
    const mode = computeMode(elm);
    const hostRef = getHostRef(elm);

    if (hostRef && hostRef.$modeName$ !== mode) {
      const cmpMeta = hostRef.$cmpMeta$;
      const oldScopeId = elm['s-sc'];
      const scopeId = getScopeId(cmpMeta, mode);
      const style = (elm.constructor as any).style[mode];
      const flags = cmpMeta.$flags$;
      if (style) {
        if (!styles.has(scopeId)) {
          registerStyle(scopeId, style, !!(flags & CMP_FLAGS.shadowDomEncapsulation));
        }
        hostRef.$modeName$ = mode;
        elm.classList.remove(oldScopeId + '-h', oldScopeId + '-s');
        attachStyles(hostRef);
        forceUpdate(elm);
      }
    }
  }
};
