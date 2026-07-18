import { BUILD } from 'virtual:app-data';
import { consoleDevWarn, consoleError, getHostRef } from 'virtual:platform';
import type * as d from '@stencil/core';

import { CMP_FLAGS, HOST_FLAGS, WATCH_FLAGS } from '../utils/constants';
import { parsePropertyValue } from './parse-property-value';
import { scheduleUpdate } from './update-component';

const applySerializers = (
  hostRef: d.HostRef,
  cmpMeta: d.ComponentRuntimeMeta,
  propName: string,
  val: any,
  instance: any,
) => {
  const run = (inst: any) => {
    let attrVal = val;
    for (const serializer of cmpMeta.$serializers$[propName]) {
      const [[methodName]] = Object.entries(serializer);
      attrVal = inst[methodName](attrVal, propName);
    }
    hostRef.$serializerValues$.set(propName, attrVal);
  };
  if (instance) {
    run(instance);
  } else {
    hostRef.$fetchedCbList$.push(() => run(hostRef.$lazyInstance$));
  }
};

export const getValue = (ref: d.RuntimeRef, propName: string) => {
  if (BUILD.signalBacking) {
    const hostRef = getHostRef(ref);
    const sig = hostRef?.$signalValues$?.get(propName);
    if (sig !== undefined) return sig.value;
  }
  return getHostRef(ref).$instanceValues$.get(propName);
};

export const setValue = (
  ref: d.RuntimeRef,
  propName: string,
  newVal: any,
  cmpMeta: d.ComponentRuntimeMeta,
) => {
  // check our new property value against our internal value
  const hostRef = getHostRef(ref);

  if (BUILD.signalBacking) {
    const sig = hostRef?.$signalValues$?.get(propName);
    if (sig !== undefined) {
      const parsed = parsePropertyValue(
        newVal,
        cmpMeta.$members$[propName][0],
        BUILD.formAssociated && !!(cmpMeta.$flags$ & CMP_FLAGS.formAssociated),
      );
      if (
        BUILD.serializer &&
        BUILD.reflect &&
        cmpMeta.$attrsToReflect$ &&
        cmpMeta.$serializers$?.[propName]
      ) {
        const elm = BUILD.lazyLoad ? hostRef.$hostElement$ : (ref as d.HostElement);
        applySerializers(
          hostRef,
          cmpMeta,
          propName,
          parsed,
          BUILD.lazyLoad ? hostRef.$lazyInstance$ : (elm as any),
        );
      }
      // @preact/signals-core uses === so NaN !== NaN always triggers effects;
      // match the legacy path's NaN-equality semantics explicitly.
      if (!(Number.isNaN(sig.peek()) && Number.isNaN(parsed))) {
        sig.value = parsed;
      }
      return;
    }
  }

  if (!hostRef) {
    if (BUILD.lazyLoad) {
      throw new Error(
        BUILD.isDev
          ? `Couldn't find host element for "${cmpMeta.$tagName$}". This usually happens when integrating a 3rd party Stencil component with another Stencil runtime. See https://github.com/stenciljs/core/issues/5457`
          : `Host element not found for "${cmpMeta.$tagName$}"`,
      );
    }
    return;
  }

  if (
    BUILD.serializer &&
    hostRef.$serializerValues$.has(propName) &&
    hostRef.$serializerValues$.get(propName) === newVal
  ) {
    // The newValue is the same as a saved serialized value from a prop update.
    // The prop can be intentionally different from the attribute;
    // updating the underlying prop here can cause an infinite loop.
    return;
  }

  const elm = BUILD.lazyLoad ? hostRef.$hostElement$ : (ref as d.HostElement);
  const oldVal = hostRef.$instanceValues$.get(propName);
  const flags = hostRef.$flags$;
  const instance = BUILD.lazyLoad ? hostRef.$lazyInstance$ : (elm as any);
  newVal = parsePropertyValue(
    newVal,
    cmpMeta.$members$[propName][0],
    BUILD.formAssociated && !!(cmpMeta.$flags$ & CMP_FLAGS.formAssociated),
  );

  // explicitly check for NaN on both sides, as `NaN === NaN` is always false
  const areBothNaN = Number.isNaN(oldVal) && Number.isNaN(newVal);
  const didValueChange = newVal !== oldVal && !areBothNaN;
  if (
    (!BUILD.lazyLoad || !(flags & HOST_FLAGS.isConstructingInstance) || oldVal === undefined) &&
    didValueChange
  ) {
    // gadzooks! the property's value has changed!!
    // set our new value!
    hostRef.$instanceValues$.set(propName, newVal);

    if (
      BUILD.serializer &&
      BUILD.reflect &&
      cmpMeta.$attrsToReflect$ &&
      cmpMeta.$serializers$?.[propName]
    ) {
      applySerializers(hostRef, cmpMeta, propName, newVal, instance);
    }

    if (BUILD.isDev) {
      if (hostRef.$flags$ & HOST_FLAGS.devOnRender) {
        consoleDevWarn(
          `The state/prop "${propName}" changed during rendering. This can potentially lead to infinite-loops and other bugs.`,
          '\nElement',
          elm,
          '\nNew value',
          newVal,
          '\nOld value',
          oldVal,
        );
      } else if (hostRef.$flags$ & HOST_FLAGS.devOnDidLoad) {
        consoleDevWarn(
          `The state/prop "${propName}" changed during "componentDidLoad()", this triggers extra re-renders, try to setup on "componentWillLoad()"`,
          '\nElement',
          elm,
          '\nNew value',
          newVal,
          '\nOld value',
          oldVal,
        );
      }
    }

    // get an array of method names of watch functions to call
    if (BUILD.propChangeCallback && cmpMeta.$watchers$) {
      const watchMethods = cmpMeta.$watchers$[propName];

      if (watchMethods) {
        // this instance is watching for when this property changed
        watchMethods.map((watcher) => {
          try {
            const [[watchMethodName, watcherFlags]] = Object.entries(watcher);
            if (flags & HOST_FLAGS.isWatchReady || watcherFlags & WATCH_FLAGS.Immediate) {
              // When signalBacking is on and signals haven't been initialized yet,
              // skip watcher dispatch here - the signal watcher effect will fire
              // synchronously during initializeSignals and handle it instead.
              if (BUILD.signalBacking && !hostRef.$signalValues$) return;
              // fire off each of the watch methods that are watching this property
              if (!instance) {
                hostRef.$fetchedCbList$.push(() => {
                  hostRef.$lazyInstance$[watchMethodName](newVal, oldVal, propName);
                });
              } else {
                instance[watchMethodName](newVal, oldVal, propName);
              }
            }
          } catch (e) {
            consoleError(e, elm);
          }
        });
      }
    }

    if (BUILD.updatable && flags & HOST_FLAGS.hasRendered) {
      if (instance.componentShouldUpdate) {
        // queue the change for a single batched `componentShouldUpdate` call
        // right before the pending render, rather than calling it here per-prop
        const changes = (hostRef.$queuedPropChanges$ ||= {});
        changes[propName] = { newVal, oldVal: changes[propName]?.oldVal ?? oldVal };
      }

      // looks like this value actually changed, so we've got work to do!
      // but only if we've already rendered, otherwise just chill out
      // queue that we need to do an update, but don't worry about queuing
      // up millions cuz this function ensures it only runs once
      if (!(flags & HOST_FLAGS.isQueuedForUpdate)) {
        scheduleUpdate(hostRef, false);
      }
    }
  }
};
