import { BUILD } from 'virtual:app-data';
import type * as d from '@stencil/core';
import { createEvent } from '../../runtime/event-emitter';
import { CMP_FLAGS, EVENT_FLAGS } from '../../utils';
import { reWireGetterSetter } from '../../utils/es2022-rewire-class-members';

/**
 * Retrieve the data structure tracking the component by its runtime reference
 * @param elm the reference to the element
 * @returns the corresponding Stencil reference data structure, or undefined if one cannot be found
 */
export const getHostRef = (elm: d.RuntimeRef | undefined): d.HostRef | undefined => {
  if (elm.__stencil__getHostRef) {
    return elm.__stencil__getHostRef();
  }

  return undefined;
};

/**
 * Add the provided `hostRef` instance to the global {@link hostRefs} map, using the provided `lazyInstance` as a key.
 * @param lazyInstance a Stencil component instance
 * @param hostRef an optional reference to Stencil's tracking data for the component. If none is provided, one will be created.
 * @throws if the provided `lazyInstance` coerces to `null`, or if the `lazyInstance` does not have a `constructor`
 * property
 */
export const registerInstance = (lazyInstance: any, hostRef: d.HostRef | null | undefined) => {
  if (lazyInstance == null || lazyInstance.constructor == null) {
    throw new Error(`Invalid component constructor`);
  }

  if (hostRef == null) {
    const Cstr = lazyInstance.constructor as d.ComponentTestingConstructor;
    const tagName = Cstr.COMPILER_META && Cstr.COMPILER_META.tagName ? Cstr.COMPILER_META.tagName : 'div';
    const elm = document.createElement(tagName);
    registerHost(elm, { $flags$: 0, $tagName$: tagName });
    hostRef = getHostRef(elm);
  }

  lazyInstance.__stencil__getHostRef = () => hostRef;
  hostRef.$lazyInstance$ = lazyInstance;

  // Re-wire getters/setters for ES2022+ class fields
  if (hostRef.$cmpMeta$?.$flags$ & CMP_FLAGS.hasModernPropertyDecls && (BUILD.state || BUILD.prop)) {
    reWireGetterSetter(lazyInstance, hostRef);
  }

  // Create EventEmitters for all events from the component and its parent classes/mixins
  // This is necessary to support events defined in mixins that may not have been included
  // in the component's compiled constructor
  const Cstr = lazyInstance.constructor as d.ComponentTestingConstructor;

  // Collect all events from the component and its prototype chain
  const allEvents: d.ComponentCompilerEvent[] = [];
  const seenEventMethods = new Set<string>();

  // First, add events from the component's COMPILER_META
  if (Cstr.COMPILER_META && Cstr.COMPILER_META.events) {
    Cstr.COMPILER_META.events.forEach((event: d.ComponentCompilerEvent) => {
      if (!seenEventMethods.has(event.method)) {
        allEvents.push(event);
        seenEventMethods.add(event.method);
      }
    });
  }

  // Then, walk the prototype chain to find events from parent classes/mixins
  let currentProto = Object.getPrototypeOf(Cstr);
  while (currentProto && currentProto !== Function.prototype && currentProto.name) {
    // Check if this parent class has a static events getter
    if (typeof currentProto.events === 'object' && Array.isArray(currentProto.events)) {
      currentProto.events.forEach((event: d.ComponentCompilerEvent) => {
        if (!seenEventMethods.has(event.method)) {
          allEvents.push(event);
          seenEventMethods.add(event.method);
        }
      });
    }
    currentProto = Object.getPrototypeOf(currentProto);
  }

  // Create EventEmitters for all collected events
  allEvents.forEach((eventMeta: d.ComponentCompilerEvent) => {
    // Only create the event emitter if it doesn't already exist on the instance
    // (it might already exist if it was created by the compiled constructor)
    if (!lazyInstance[eventMeta.method]) {
      let flags = 0;
      if (eventMeta.bubbles) flags |= EVENT_FLAGS.Bubbles;
      if (eventMeta.composed) flags |= EVENT_FLAGS.Composed;
      if (eventMeta.cancelable) flags |= EVENT_FLAGS.Cancellable;

      lazyInstance[eventMeta.method] = createEvent(lazyInstance, eventMeta.name, flags);
    }
  });
};

/**
 * Create a new {@link d.HostRef} instance to the global {@link hostRefs} map, using the provided `elm` as a key.
 * @param elm an HTMLElement instance associated with the Stencil component
 * @param cmpMeta the component compiler metadata associated with the component
 */
export const registerHost = (elm: d.HostElement, cmpMeta: d.ComponentRuntimeMeta): void => {
  const hostRef: d.HostRef = {
    $flags$: 0,
    $hostElement$: elm,
    $cmpMeta$: cmpMeta,
    $instanceValues$: new Map(),
    $serializerValues$: new Map(),
    $renderCount$: 0,
  };
  hostRef.$fetchedCbList$ = [];
  hostRef.$onInstancePromise$ = new Promise((r) => (hostRef.$onInstanceResolve$ = r));
  hostRef.$onReadyPromise$ = new Promise((r) => (hostRef.$onReadyResolve$ = r));
  elm['s-p'] = [];
  elm['s-rc'] = [];
  elm.__stencil__getHostRef = () => hostRef;
};
