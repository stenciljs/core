/**
 * Browser build-time stand-in for the `resolve` npm package (real on-disk
 * Node module resolution - swapped in via `alias` in `tsdown.config.ts`'s
 * `compiler/browser` entry only). Only reachable via `sys.resolveModuleId`,
 * which `transpile()`/`transpileSync()` never call - real multi-file module
 * resolution in a browser playground goes through `TranspileOptions.resolveImport`
 * instead, which the caller supplies.
 */
type ResolveCallback = (err: Error | null, resolved?: string, pkgData?: unknown) => void;

const resolve = (id: string, _opts: unknown, cb: ResolveCallback) => {
  cb(new Error(`Cannot resolve "${id}" - module resolution isn't available in the browser build.`));
};

export default resolve;
export type AsyncOpts = Record<string, unknown>;
