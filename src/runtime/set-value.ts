import { BUILD } from '@app-data';
import { consoleDevWarn, consoleError, getHostRef } from '@platform';
import { HOST_FLAGS } from '@utils';

import type * as d from '../declarations';
import { parsePropertyValue } from './parse-property-value';
import { scheduleUpdate } from './update-component';

export const getValue = (ref: d.RuntimeRef, propName: string) => getHostRef(ref).$instanceValues$.get(propName);

export const setValue = (ref: d.RuntimeRef, propName: string, newVal: any, cmpMeta: d.ComponentRuntimeMeta) => {
  // check our new property value against our internal value
  const hostRef = getHostRef(ref);

  /**
   * If the host element is not found, let's fail with a better error message and provide
   * details on why this may happen. In certain cases, e.g. see https://github.com/stenciljs/core/issues/5457,
   * users might import a component through e.g. a loader script, which causes confusions in runtime
   * as there are multiple runtimes being loaded and/or different components used with different
   * loading strategies, e.g. lazy vs implicitly loaded.
   *
   * Todo(STENCIL-1308): remove, once a solution for this was identified and implemented
   */
  if (BUILD.lazyLoad && !hostRef) {
    throw new Error(
      `Couldn't find host element for "${cmpMeta.$tagName$}" as it is ` +
        'unknown to this Stencil runtime. This usually happens when integrating ' +
        'a 3rd party Stencil component with another Stencil component or application. ' +
        'Please reach out to the maintainers of the 3rd party Stencil component or report ' +
        'this on the Stencil Discord server (https://chat.stenciljs.com) or comment ' +
        'on this similar [GitHub issue](https://github.com/stenciljs/core/issues/5457).',
    );
  }

  const elm = BUILD.lazyLoad ? hostRef.$hostElement$ : (ref as d.HostElement);
  const oldVal = hostRef.$instanceValues$.get(propName);
  const flags = hostRef.$flags$;
  const instance = BUILD.lazyLoad ? hostRef.$lazyInstance$ : (elm as any);
  newVal = parsePropertyValue(newVal, cmpMeta.$members$[propName][0]);

  // explicitly check for NaN on both sides, as `NaN === NaN` is always false
  const areBothNaN = Number.isNaN(oldVal) && Number.isNaN(newVal);
  const didValueChange = newVal !== oldVal && !areBothNaN;
  if ((!BUILD.lazyLoad || !(flags & HOST_FLAGS.isConstructingInstance) || oldVal === undefined) && didValueChange) {
    // gadzooks! the property's value has changed!!
    // set our new value!
    hostRef.$instanceValues$.set(propName, newVal);

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

    if (!BUILD.lazyLoad || instance) {
      // get an array of method names of watch functions to call
      if (BUILD.watchCallback && cmpMeta.$watchers$ && flags & HOST_FLAGS.isWatchReady) {
        const watchMethods = cmpMeta.$watchers$[propName];

        if (watchMethods) {
          // this instance is watching for when this property changed
          watchMethods.map((watchMethodName) => {
            try {
              // fire off each of the watch methods that are watching this property
              instance[watchMethodName](newVal, oldVal, propName);
            } catch (e) {
              consoleError(e, elm);
            }
          });
        }
      }

      if (
        BUILD.updatable &&
        (flags & (HOST_FLAGS.hasRendered | HOST_FLAGS.isQueuedForUpdate)) === HOST_FLAGS.hasRendered
      ) {
        if (instance.componentShouldUpdate) {
          if (instance.componentShouldUpdate(newVal, oldVal, propName) === false) {
            return;
          }
        }
        // looks like this value actually changed, so we've got work to do!
        // but only if we've already rendered, otherwise just chill out
        // queue that we need to do an update, but don't worry about queuing
        // up millions cuz this function ensures it only runs once
        scheduleUpdate(hostRef, false);
      }
    }
  }
};
