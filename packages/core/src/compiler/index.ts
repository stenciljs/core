import ts from 'typescript';

export { buildId, vermoji, version, versions } from '../version';
export { createCompiler } from './compiler';
export { loadConfig } from './config/load-config';
export { optimizeCss } from './optimize/optimize-css';
export { optimizeJs } from './optimize/optimize-js';
export { createPrerenderer } from './prerender/prerender-main';
export type { FsWriteResults } from './sys/in-memory-fs';
export { nodeRequire } from './sys/node-require';
export { createSystem } from './sys/stencil-sys';
export { getScopeId } from './style/scope-css';
export { generateManifest } from './docs/cem/index';
export type { CustomElementsManifest } from './docs/cem/index';
export { cmpMetaToDocsComponent } from './docs/generate-doc-data';
export { transpile, transpileSync } from './transpile';
export { scopeCss } from '../utils/shadow-css';
export { createWorkerContext } from './worker/worker-thread';
export { createWorkerMessageHandler } from './worker/worker-thread';
export { ts };
export { validateConfig } from './config/validate-config';
export * from '../declarations/stencil-public-compiler';
// Compiler-facing types that live in `stencil-private.ts` alongside runtime-internal
// types (e.g. HostElement, HostRef). Only the subset actually consumed outside of
// `@stencil/core` is re-exported here - the runtime internals are intentionally not public.
export type {
  ComponentCompilerMeta,
  ComponentCompilerTypeReferences,
  LazyBundlesRuntimeData,
  PackageJsonData,
  PrintLine,
  SsrResults,
} from '../declarations/stencil-private';
