/**
 * Browser build-time stand-in for the `resolve` npm package (real on-disk
 * Node module resolution - swapped in via `alias` in `tsdown.config.ts`'s
 * `compiler/browser` entry only).
 */
type ResolveCallback = (err: Error | null, resolved?: string, pkgData?: unknown) => void;

const resolve = (id: string, _opts: unknown, cb: ResolveCallback) => {
  cb(new Error(`Cannot resolve "${id}" - module resolution isn't available in the browser build.`));
};

export default resolve;
export type AsyncOpts = Record<string, unknown>;
