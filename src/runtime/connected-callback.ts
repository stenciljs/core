import { BUILD } from '@app-data';
import { addHostEventListeners, getHostRef, nextTick, plt, supportsShadow, win } from '@platform';
import { CMP_FLAGS, HOST_FLAGS, MEMBER_FLAGS } from '@utils';

import type * as d from '../declarations';
import { initializeClientHydrate } from './client-hydrate';
import { fireConnectedCallback, initializeComponent } from './initialize-component';
import { createTime } from './profile';
import { HYDRATE_ID, NODE_TYPE, PLATFORM_FLAGS } from './runtime-constants';
import { addStyle, getScopeId } from './styles';
import { attachToAncestor } from './update-component';
import { insertBefore } from './vdom/vdom-render';

export const connectedCallback = (elm: d.HostElement) => {
  if ((plt.$flags$ & PLATFORM_FLAGS.isTmpDisconnected) === 0) {
    const hostRef = getHostRef(elm);
    const cmpMeta = hostRef.$cmpMeta$;
    const endConnected = createTime('connectedCallback', cmpMeta.$tagName$);

    if (BUILD.hostListenerTargetParent) {
      // only run if we have listeners being attached to a parent
      addHostEventListeners(elm, hostRef, cmpMeta.$listeners$, true);
    }

    if (!(hostRef.$flags$ & HOST_FLAGS.hasConnected)) {
      // first time this component has connected
      hostRef.$flags$ |= HOST_FLAGS.hasConnected;

      let hostId: string;
      if (BUILD.hydrateClientSide) {
        hostId = elm.getAttribute(HYDRATE_ID);
        if (hostId) {
          if (BUILD.shadowDom && supportsShadow && cmpMeta.$flags$ & CMP_FLAGS.shadowDomEncapsulation) {
            const scopeId = BUILD.mode
              ? addStyle(elm.shadowRoot, cmpMeta, elm.getAttribute('s-mode'))
              : addStyle(elm.shadowRoot, cmpMeta);
            elm.classList.remove(scopeId + '-h', scopeId + '-s');
          } else if (BUILD.scoped && cmpMeta.$flags$ & CMP_FLAGS.scopedCssEncapsulation) {
            // set the scope id on the element now. Useful when hydrating,
            // to more quickly set the initial scoped classes for scoped css
            const scopeId = getScopeId(cmpMeta, BUILD.mode ? elm.getAttribute('s-mode') : undefined);
            elm['s-sc'] = scopeId;
          }
          initializeClientHydrate(elm, cmpMeta.$tagName$, hostId, hostRef);
        }
      }

      if (BUILD.slotRelocation && !hostId) {
        // initUpdate
        // if the slot polyfill is required we'll need to put some nodes
        // in here to act as original content anchors as we move nodes around
        // host element has been connected to the DOM
        if (
          BUILD.hydrateServerSide ||
          ((BUILD.slot || BUILD.shadowDom) &&
            // TODO(STENCIL-854): Remove code related to legacy shadowDomShim field
            cmpMeta.$flags$ & (CMP_FLAGS.hasSlotRelocation | CMP_FLAGS.needsShadowDomShim))
        ) {
          setContentReference(elm);
        }
      }

      if (BUILD.asyncLoading) {
        // find the first ancestor component (if there is one) and register
        // this component as one of the actively loading child components for its ancestor
        let ancestorComponent = elm;

        while ((ancestorComponent = (ancestorComponent.parentNode as any) || (ancestorComponent.host as any))) {
          // climb up the ancestors looking for the first
          // component that hasn't finished its lifecycle update yet
          if (
            (BUILD.hydrateClientSide &&
              ancestorComponent.nodeType === NODE_TYPE.ElementNode &&
              ancestorComponent.hasAttribute('s-id') &&
              ancestorComponent['s-p']) ||
            ancestorComponent['s-p']
          ) {
            // we found this components first ancestor component
            // keep a reference to this component's ancestor component
            attachToAncestor(hostRef, (hostRef.$ancestorComponent$ = ancestorComponent));
            break;
          }
        }
      }

      // Lazy properties
      // https://developers.google.com/web/fundamentals/web-components/best-practices#lazy-properties
      if (BUILD.prop && !BUILD.hydrateServerSide && cmpMeta.$members$) {
        Object.entries(cmpMeta.$members$).map(([memberName, [memberFlags]]) => {
          if (memberFlags & MEMBER_FLAGS.Prop && elm.hasOwnProperty(memberName)) {
            const value = (elm as any)[memberName];
            delete (elm as any)[memberName];
            (elm as any)[memberName] = value;
          }
        });
      }

      if (BUILD.initializeNextTick) {
        // connectedCallback, taskQueue, initialLoad
        // angular sets attribute AFTER connectCallback
        // https://github.com/angular/angular/issues/18909
        // https://github.com/angular/angular/issues/19940
        nextTick(() => initializeComponent(elm, hostRef, cmpMeta));
      } else {
        initializeComponent(elm, hostRef, cmpMeta);
      }
    } else {
      // not the first time this has connected

      // reattach any event listeners to the host
      // since they would have been removed when disconnected
      addHostEventListeners(elm, hostRef, cmpMeta.$listeners$, false);

      // fire off connectedCallback() on component instance
      if (hostRef?.$lazyInstance$) {
        fireConnectedCallback(hostRef.$lazyInstance$, elm);
      } else if (hostRef?.$onReadyPromise$) {
        hostRef.$onReadyPromise$.then(() => fireConnectedCallback(hostRef.$lazyInstance$, elm));
      }
    }

    endConnected();
  }
};

const setContentReference = (elm: d.HostElement) => {
  if (!win.document) {
    return;
  }

  // only required when we're NOT using native shadow dom (slot)
  // or this browser doesn't support native shadow dom
  // and this host element was NOT created with SSR
  // let's pick out the inner content for slot projection
  // create a node to represent where the original
  // content was first placed, which is useful later on
  const contentRefElm = (elm['s-cr'] = win.document.createComment(
    BUILD.isDebug ? `content-ref (host=${elm.localName})` : '',
  ) as any);
  contentRefElm['s-cn'] = true;
  insertBefore(elm, contentRefElm, elm.firstChild as d.RenderNode);
};
