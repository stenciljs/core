/**
 * Browser build-time stand-in for `lightningcss` (native Rust CSS engine, no
 * browser build - swapped in via `alias` in `tsdown.config.ts`'s
 * `compiler/browser` entry only).
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
