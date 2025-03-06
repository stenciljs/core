import { BUILD } from '@app-data';
import { addHostEventListeners, forceUpdate, getHostRef, registerHost, styles, supportsShadow } from '@platform';
import { CMP_FLAGS } from '@utils';

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
import { computeMode } from './mode';
import { proxyComponent } from './proxy-component';
import { PROXY_FLAGS } from './runtime-constants';
import { attachStyles, getScopeId, hydrateScopedToShadow, registerStyle } from './styles';

export const defineCustomElement = (Cstr: any, compactMeta: d.ComponentRuntimeMetaCompact) => {
  customElements.define(compactMeta[1], proxyCustomElement(Cstr, compactMeta) as CustomElementConstructor);
};

export const proxyCustomElement = (Cstr: any, compactMeta: d.ComponentRuntimeMetaCompact) => {
  const cmpMeta: d.ComponentRuntimeMeta = {
    $flags$: compactMeta[0],
    $tagName$: compactMeta[1],
  };
  if (BUILD.member) {
    cmpMeta.$members$ = compactMeta[2];
  }
  if (BUILD.hostListener) {
    cmpMeta.$listeners$ = compactMeta[3];
  }
  if (BUILD.watchCallback) {
    cmpMeta.$watchers$ = Cstr.$watchers$;
  }
  if (BUILD.reflect) {
    cmpMeta.$attrsToReflect$ = [];
  }
  if (BUILD.shadowDom && !supportsShadow && cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation) {
    // TODO(STENCIL-854): Remove code related to legacy shadowDomShim field
    cmpMeta.$flags$ |= CMP_FLAGS.needsShadowDomShim;
  }

  // TODO(STENCIL-914): this check and `else` block can go away and be replaced by just the `scoped` check
  if (BUILD.experimentalSlotFixes) {
    if (BUILD.scoped && cmpMeta.$flags$ & CMP_FLAGS.scopedCssEncapsulation) {
      // This check is intentionally not combined with the surrounding `experimentalSlotFixes` check
      // since, moving forward, we only want to patch the pseudo shadow DOM when the component is scoped
      patchPseudoShadowDom(Cstr.prototype);
    }
  } else {
    if (BUILD.slotChildNodesFix) {
      patchChildSlotNodes(Cstr.prototype);
    }
    if (BUILD.cloneNodeFix) {
      patchCloneNode(Cstr.prototype);
    }
    if (BUILD.appendChildSlotFix) {
      patchSlotAppendChild(Cstr.prototype);
    }
    if (BUILD.scopedSlotTextContentFix && cmpMeta.$flags$ & CMP_FLAGS.scopedCssEncapsulation) {
      patchTextContent(Cstr.prototype);
    }
  }

  if (BUILD.hydrateClientSide && BUILD.shadowDom) {
    hydrateScopedToShadow();
  }

  const originalConnectedCallback = Cstr.prototype.connectedCallback;
  const originalDisconnectedCallback = Cstr.prototype.disconnectedCallback;
  Object.assign(Cstr.prototype, {
    __hasHostListenerAttached: false,
    __registerHost() {
      registerHost(this, cmpMeta);
    },
    connectedCallback() {
      if (!this.__hasHostListenerAttached) {
        const hostRef = getHostRef(this);
        addHostEventListeners(this, hostRef, cmpMeta.$listeners$, false);
        this.__hasHostListenerAttached = true;
      }

      connectedCallback(this);
      if (originalConnectedCallback) {
        originalConnectedCallback.call(this);
      }
    },
    disconnectedCallback() {
      disconnectedCallback(this);
      if (originalDisconnectedCallback) {
        originalDisconnectedCallback.call(this);
      }
    },
    __attachShadow() {
      if (supportsShadow) {
        if (!this.shadowRoot) {
          if (BUILD.shadowDelegatesFocus) {
            this.attachShadow({
              mode: 'open',
              delegatesFocus: !!(cmpMeta.$flags$ & CMP_FLAGS.shadowDelegatesFocus),
            });
          } else {
            this.attachShadow({ mode: 'open' });
          }
        } else {
          // we want to check to make sure that the mode for the shadow
          // root already attached to the element (i.e. created via DSD)
          // is set to 'open' since that's the only mode we support
          if (this.shadowRoot.mode !== 'open') {
            throw new Error(
              `Unable to re-use existing shadow root for ${cmpMeta.$tagName$}! Mode is set to ${this.shadowRoot.mode} but Stencil only supports open shadow roots.`,
            );
          }
        }
      } else {
        (this as any).shadowRoot = this;
      }
    },
  });
  Cstr.is = cmpMeta.$tagName$;

  return proxyComponent(Cstr, cmpMeta, PROXY_FLAGS.isElementConstructor | PROXY_FLAGS.proxyState);
};

export const forceModeUpdate = (elm: d.RenderNode) => {
  if (BUILD.style && BUILD.mode && !BUILD.lazyLoad) {
    const mode = computeMode(elm);
    const hostRef = getHostRef(elm);

    if (hostRef.$modeName$ !== mode) {
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
