import { BUILD } from '@app-data';

import type * as d from '../declarations';

interface StencilWindow extends Omit<Window, 'document'> {
  document?: Document;
}

export const win = (typeof window !== 'undefined' ? window : ({} as StencilWindow)) as StencilWindow;

export const H = ((win as any).HTMLElement || (class {} as any)) as HTMLElement;

export const plt: d.PlatformRuntime = {
  $flags$: 0,
  $resourcesUrl$: '',
  jmp: (h) => h(),
  raf: (h) => requestAnimationFrame(h),
  ael: (el, eventName, listener, opts) => el.addEventListener(eventName, listener, opts),
  rel: (el, eventName, listener, opts) => el.removeEventListener(eventName, listener, opts),
  ce: (eventName, opts) => new CustomEvent(eventName, opts),
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

export const supportsShadow = BUILD.shadowDom;

export const supportsListenerOptions = /*@__PURE__*/ (() => {
  let supportsListenerOptions = false;
  try {
    win.document?.addEventListener(
      'e',
      null,
      Object.defineProperty({}, 'passive', {
        get() {
          supportsListenerOptions = true;
        },
      }),
    );
  } catch (e) {}
  return supportsListenerOptions;
})();

export const promiseResolve = (v?: any) => Promise.resolve(v);

export const supportsConstructableStylesheets = BUILD.constructableCSS
  ? /*@__PURE__*/ (() => {
      try {
        new CSSStyleSheet();
        return typeof new CSSStyleSheet().replaceSync === 'function';
      } catch (e) {}
      return false;
    })()
  : false;

export { H as HTMLElement };
