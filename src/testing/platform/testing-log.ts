import type * as d from '../../declarations';
import { caughtErrors } from './testing-constants';

let customError: d.ErrorHandler | undefined;

const defaultConsoleError = (e: any) => {
  caughtErrors.push(e);
};

export const consoleError: d.ErrorHandler = (e: any, el?: any) => (customError || defaultConsoleError)(e, el);

export const consoleDevError = (...e: any[]) => {
  caughtErrors.push(new Error(e.join(', ')));
};

export const consoleDevWarn = (...args: any[]) => {
  // log warnings so we can spy on them when testing
  const params = args.filter((a) => typeof a === 'string' || typeof a === 'number' || typeof a === 'boolean');
  console.warn(...params);
};

export const consoleDevInfo = (..._: any[]) => {
  /* noop for testing */
};

export const setErrorHandler = (handler: d.ErrorHandler | undefined) => (customError = handler);
