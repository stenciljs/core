import { BUILD } from '@app-data';

import type * as d from '../declarations';

let customError: d.ErrorHandler;

export const consoleError: d.ErrorHandler = (e: any, el?: HTMLElement) => (customError || console.error)(e, el);

export const STENCIL_DEV_MODE = BUILD.isTesting
  ? ['STENCIL:'] // E2E testing
  : [
      '%cstencil',
      'color: white;background:#4c47ff;font-weight: bold; font-size:10px; padding:2px 6px; border-radius: 5px',
    ];

export const consoleDevError = (...m: any[]) => console.error(...STENCIL_DEV_MODE, ...m);

export const consoleDevWarn = (...m: any[]) => console.warn(...STENCIL_DEV_MODE, ...m);

export const consoleDevInfo = (...m: any[]) => console.info(...STENCIL_DEV_MODE, ...m);

export const setErrorHandler = (handler: d.ErrorHandler) => (customError = handler);
