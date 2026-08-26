/**
 * Browser build-time stand-in for `lightningcss` (native Rust CSS engine, no
 * browser build - swapped in via `alias` in `tsdown.config.ts`'s
 * `compiler/browser` entry only). Vendor-prefixing/minifying CSS for *other*
 * browsers doesn't apply when the browser rendering the preview is the only
 * target, so autoprefixing is skipped: `transform()` passes the CSS through
 * unchanged instead of failing.
 */
interface TransformInput {
  code: Uint8Array | string;
}

export const transform = (input: TransformInput) => ({
  code: {
    toString: () =>
      typeof input.code === 'string' ? input.code : new TextDecoder().decode(input.code),
  },
});

export const browserslistToTargets = (_browsers: unknown) => undefined;

export type Targets = undefined;
