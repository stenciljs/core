import { BUILD } from '@app-data';
import { consoleError, plt, supportsListenerOptions, win } from '@platform';
import { HOST_FLAGS, LISTENER_FLAGS } from '@utils';

import type * as d from '../declarations';

export const addHostEventListeners = (
  elm: d.HostElement,
  hostRef: d.HostRef,
  listeners?: d.ComponentRuntimeHostListener[],
  attachParentListeners?: boolean,
) => {
  if (BUILD.hostListener && listeners && win.document) {
    // this is called immediately within the element's constructor
    // initialize our event listeners on the host element
    // we do this now so that we can listen to events that may
    // have fired even before the instance is ready

    if (BUILD.hostListenerTargetParent) {
      // this component may have event listeners that should be attached to the parent
      if (attachParentListeners) {
        // this is being ran from within the connectedCallback
        // which is important so that we know the host element actually has a parent element
        // filter out the listeners to only have the ones that ARE being attached to the parent
        listeners = listeners.filter(([flags]) => flags & LISTENER_FLAGS.TargetParent);
      } else {
        // this is being ran from within the component constructor
        // everything BUT the parent element listeners should be attached at this time
        // filter out the listeners that are NOT being attached to the parent
        listeners = listeners.filter(([flags]) => !(flags & LISTENER_FLAGS.TargetParent));
      }
    }

    listeners.map(([flags, name, method]) => {
      const target = BUILD.hostListenerTarget ? getHostListenerTarget(win.document, elm, flags) : elm;
      const handler = hostListenerProxy(hostRef, method);
      const opts = hostListenerOpts(flags);
      plt.ael(target, name, handler, opts);
      (hostRef.$rmListeners$ = hostRef.$rmListeners$ || []).push(() => plt.rel(target, name, handler, opts));
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
  if (BUILD.hostListenerTargetParent && flags & LISTENER_FLAGS.TargetParent && elm.parentElement) {
    return elm.parentElement;
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
