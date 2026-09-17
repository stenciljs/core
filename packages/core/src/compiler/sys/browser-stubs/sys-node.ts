/**
 * Browser build-time stand-in for `src/sys/node/index.ts`. Swapped in for
 * the `'../../sys/node'` specifier via `alias` in `tsdown.config.ts`'s
 * `compiler/browser` entry
 */
import type { CompilerSystem, Logger, LoggerTimeSpan, LogLevel } from '@stencil/core';

export const createNodeSys = (): CompilerSystem => {
  throw new Error(
    'No `sys` provided. The browser build of the Stencil compiler has no default ' +
      'file system - pass `createSystem()` (from `@stencil/core/compiler/browser`) as `sys`.',
  );
};

const identity = (msg: string) => msg;

export const createNodeLogger = (): Logger => {
  let level: LogLevel = 'info';

  const createTimeSpan: Logger['createTimeSpan'] = (startMsg) => {
    const start = Date.now();
    const timeSpan: LoggerTimeSpan = {
      duration: () => Date.now() - start,
      finish: (finishedMsg) => {
        const duration = Date.now() - start;
        console.log(`${finishedMsg} (${duration}ms)`);
        return duration;
      },
    };
    console.log(startMsg);
    return timeSpan;
  };

  return {
    enableColors: () => {},
    setLevel: (l) => (level = l),
    getLevel: () => level,
    debug: (...msg) => console.debug(...msg),
    info: (...msg) => console.info(...msg),
    warn: (...msg) => console.warn(...msg),
    error: (...msg) => console.error(...msg),
    createTimeSpan,
    printDiagnostics: (diagnostics) => diagnostics.forEach((d) => console.log(d.messageText)),
    red: identity,
    green: identity,
    yellow: identity,
    blue: identity,
    magenta: identity,
    cyan: identity,
    gray: identity,
    bold: identity,
    dim: identity,
    bgRed: identity,
    emoji: () => '',
  };
};

export const setupNodeProcess = () => {};
