import { BUILD } from 'virtual:app-data';
import { getHostRef, plt } from 'virtual:platform';
import type * as d from '@stencil/core';

import { HOST_FLAGS } from '../utils/constants';
import { PLATFORM_FLAGS } from './runtime-constants';
import { rootAppliedStyles } from './styles';
import { markFirstConnected, safeCall } from './update-component';

const disconnectInstance = (instance: any, elm?: d.HostElement) => {
  if (BUILD.lazyLoad) {
    safeCall(instance, 'disconnectedCallback', undefined, elm || instance);
  }
};

export const disconnectedCallback = async (elm: d.HostElement) => {
  if ((plt.$flags$ & PLATFORM_FLAGS.isTmpDisconnected) === 0) {
    const hostRef = getHostRef(elm);

    if (BUILD.hostListener) {
      if (hostRef?.$rmListeners$) {
        hostRef.$rmListeners$.map((rmListener) => rmListener());
        hostRef.$rmListeners$ = undefined;
      }
    }

    if (BUILD.vdomSignals && hostRef?.$signalCleanup$) {
      hostRef.$signalCleanup$();
      hostRef.$signalCleanup$ = undefined;
    }

    // A component removed before its real `connectedCallback` has fired (module still in
    // flight, or an autoloader hasn't defined its class yet) will now never fire it - release
    // anything waiting on that (so it doesn't hang forever)
    if (BUILD.asyncLoading && hostRef && !(hostRef.$flags$ & HOST_FLAGS.hasFiredConnected)) {
      markFirstConnected(hostRef);
    }

    if (!BUILD.lazyLoad) {
      disconnectInstance(elm);
    } else if (hostRef?.$lazyInstance$) {
      disconnectInstance(hostRef.$lazyInstance$, elm);
    } else if (hostRef?.$onReadyPromise$) {
      hostRef.$onReadyPromise$.then(() => disconnectInstance(hostRef.$lazyInstance$, elm));
    }
  }

  /**
   * Remove the element from the `rootAppliedStyles` WeakMap
   */
  if (rootAppliedStyles.has(elm)) {
    rootAppliedStyles.delete(elm);
  }

  /**
   * Remove the shadow root from the `rootAppliedStyles` WeakMap
   */
  if (elm.shadowRoot && rootAppliedStyles.has(elm.shadowRoot as unknown as Element)) {
    rootAppliedStyles.delete(elm.shadowRoot as unknown as Element);
  }
};
