import { BUILD } from 'virtual:app-data';
import { consoleError, plt, supportsListenerOptions, win } from 'virtual:platform';
import type * as d from '@stencil/core';

import { HOST_FLAGS, LISTENER_FLAGS } from '../utils/constants';

export const addHostEventListeners = (
  elm: d.HostElement,
  hostRef: d.HostRef,
  listeners?: d.ComponentRuntimeHostListener[],
) => {
  if (BUILD.hostListener && listeners && win.document) {
    // this is called immediately within the element's constructor
    // initialize our event listeners on the host element
    // we do this now so that we can listen to events that may
    // have fired even before the instance is ready

    listeners.map(([flags, name, method]) => {
      const target = BUILD.hostListenerTarget
        ? getHostListenerTarget(win.document, elm, flags)
        : elm;
      const handler = hostListenerProxy(hostRef, method);
      const opts = hostListenerOpts(flags);
      plt.ael(target, name, handler, opts);
      (hostRef.$rmListeners$ = hostRef.$rmListeners$ || []).push(() =>
        plt.rel(target, name, handler, opts),
      );
    });
  }
};

const hostListenerProxy = (hostRef: d.HostRef, methodName: string) => (ev: Event) => {
  try {
    if (BUILD.lazyLoad) {
      if (hostRef.$flags$ & HOST_FLAGS.isListenReady) {
        // instance is ready, let's call it's member method for this event
        hostRef.$lazyInstance$?.[methodName](ev);
      } else {
        (hostRef.$queuedListeners$ = hostRef.$queuedListeners$ || []).push([methodName, ev]);
      }
    } else {
      (hostRef.$hostElement$ as any)[methodName](ev);
    }
  } catch (e) {
    consoleError(e, hostRef.$hostElement$);
  }
};

const getHostListenerTarget = (doc: Document, elm: Element, flags: number): EventTarget => {
  if (BUILD.hostListenerTargetDocument && flags & LISTENER_FLAGS.TargetDocument) {
    return doc;
  }
  if (BUILD.hostListenerTargetWindow && flags & LISTENER_FLAGS.TargetWindow) {
    return win;
  }
  if (BUILD.hostListenerTargetBody && flags & LISTENER_FLAGS.TargetBody) {
    return doc.body;
  }

  return elm;
};

// prettier-ignore
const hostListenerOpts = (flags: number) =>
  supportsListenerOptions
    ? ({
        passive: (flags & LISTENER_FLAGS.Passive) !== 0,
        capture: (flags & LISTENER_FLAGS.Capture) !== 0,
      })
    : (flags & LISTENER_FLAGS.Capture) !== 0;
