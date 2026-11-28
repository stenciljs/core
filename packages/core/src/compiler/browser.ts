import ts from 'typescript';

/**
 * Browser-safe subset of `@stencil/core/compiler`. Built separately (see
 * `tsdown.config.ts`'s `compiler/browser` entry) so it never shares a chunk
 * with `src/sys/node/` - the CLI/dev-server/file-watcher machinery the main
 * `./compiler` entry pulls in has no browser equivalent.
 *
 * Callers must supply their own `sys` (see `createSystem`) and `logger` -
 * there is no on-disk default here.
 */

// typescript.js references the `process` global directly
if (typeof globalThis.process === 'undefined') {
  globalThis.process = {
    env: {},
    argv: [],
    platform: 'browser',
    version: '',
    versions: {},
    cwd: () => '/',
    nextTick: (fn: (...args: unknown[]) => void, ...args: unknown[]) =>
      queueMicrotask(() => fn(...args)),
  } as unknown as NodeJS.Process;
}

export { createSystem } from './sys/stencil-sys';
export { scopeCss } from '../utils/shadow-css';
export { transpile, transpileSync } from './transpile';
export { generateComponentTypes } from './types/generate-component-types';
export { ts };
export type {
  BuildOverrides,
  CompilerSystem,
  Diagnostic,
  Logger,
  TranspileOptions,
  TranspileResults,
} from '../declarations/stencil-public-compiler';
