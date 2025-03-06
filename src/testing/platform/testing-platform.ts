import type * as d from '@stencil/core/internal';

import { cstrs, moduleLoaded, styles } from './testing-constants';
import { flushAll, resetTaskQueue } from './testing-task-queue';
import { win } from './testing-window';

export let supportsShadow = true;

export const plt: d.PlatformRuntime = {
  $flags$: 0,
  $resourcesUrl$: '',
  jmp: (h) => h(),
  raf: (h) => requestAnimationFrame(h),
  ael: (el, eventName, listener, opts) => el.addEventListener(eventName, listener, opts),
  rel: (el, eventName, listener, opts) => el.removeEventListener(eventName, listener, opts),
  ce: (eventName, opts) => new (win as any).CustomEvent(eventName, opts),
};

export const setPlatformHelpers = (helpers: {
  jmp?: (c: any) => any;
  raf?: (c: any) => number;
  ael?: (el: any, eventName: string, listener: any, options: any) => void;
  rel?: (el: any, eventName: string, listener: any, options: any) => void;
  ce?: (eventName: string, opts?: any) => any;
}) => {
  Object.assign(plt, helpers);
};

export const supportsListenerOptions = true;
export const supportsConstructableStylesheets = false;

/**
 * Helper function to programmatically set shadow DOM support in testing scenarios.
 *
 * This function modifies the global {@link supportsShadow} variable.
 *
 * @param supports `true` if shadow DOM is supported, `false` otherwise
 */
export const setSupportsShadowDom = (supports: boolean): void => {
  supportsShadow = supports;
};

/**
 * Resets global testing variables and collections, so that a new set of tests can be started with a "clean slate".
 *
 * It is expected that this function be called between spec tests, and should be automatically configured by Stencil to
 * do so.
 *
 * @param defaults default options for the {@link d.PlatformRuntime} used during testing. The values in this object
 * with be assigned to the global {@link plt} object used during testing.
 */
export function resetPlatform(defaults: Partial<d.PlatformRuntime> = {}) {
  if (win && typeof win.close === 'function') {
    win.close();
  }

  styles.clear();
  plt.$flags$ = 0;
  Object.assign(plt, defaults);

  if (plt.$orgLocNodes$ != null) {
    plt.$orgLocNodes$.clear();
    plt.$orgLocNodes$ = undefined;
  }

  win.location.href = plt.$resourcesUrl$ = `http://testing.stenciljs.com/`;

  resetTaskQueue();
  stopAutoApplyChanges();

  cstrs.clear();
}

let isAutoApplyingChanges = false;
let autoApplyTimer: any = undefined;

/**
 * Cancels the JavaScript task of automatically flushing the render queue & applying DOM changes in tests
 */
export function stopAutoApplyChanges(): void {
  isAutoApplyingChanges = false;
  if (autoApplyTimer) {
    clearTimeout(autoApplyTimer);
    autoApplyTimer = undefined;
  }
}

/**
 * Creates a JavaScript task to flush the render pipeline without the user having to do so manually in their tests.
 */
export async function startAutoApplyChanges(): Promise<void> {
  isAutoApplyingChanges = true;
  flushAll().then(() => {
    if (isAutoApplyingChanges) {
      autoApplyTimer = setTimeout(() => {
        startAutoApplyChanges();
      }, 100);
    }
  });
}

/**
 * Registers a collection of component constructors with the global {@link cstrs} data structure
 * @param Cstrs the component constructors to register
 */
export const registerComponents = (Cstrs: d.ComponentTestingConstructor[]): void => {
  Cstrs.filter((Cstr) => Cstr.COMPILER_META).forEach((Cstr) => {
    cstrs.set(Cstr.COMPILER_META.tagName, Cstr);
  });
};

/**
 * Add the provided component constructor, `Cstr`, to the {@link moduleLoaded} mapping, using the provided `bundleId`
 * as the key
 * @param bundleId the bundle identifier to use to store/retrieve the component constructor
 * @param Cstr the component constructor to store
 */
export function registerModule(bundleId: string, Cstr: d.ComponentTestingConstructor): void {
  moduleLoaded.set(bundleId, Cstr);
}

export const isMemberInElement = (elm: any, memberName: string) => {
  if (elm != null) {
    if (memberName in elm) {
      return true;
    }
    const nodeName = elm.nodeName;
    if (nodeName) {
      const cstr = cstrs.get(nodeName.toLowerCase());
      if (cstr != null && cstr.COMPILER_META != null && cstr.COMPILER_META.properties != null) {
        return cstr.COMPILER_META.properties.some((p) => p.name === memberName);
      }
    }
  }
  return false;
};
