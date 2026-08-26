/**
 * Browser build-time stand-in for `browserslist` (queries real browser usage
 * data from disk - swapped in via `alias` in `tsdown.config.ts`'s
 * `compiler/browser` entry only). Paired with the `lightningcss` stub, whose
 * `browserslistToTargets` ignores its input entirely, so this only needs to
 * not throw.
 */
const browserslist = (_query?: string[]): string[] => [];

export default browserslist;
