// Browser build-time stand-in for the `util-deprecate` npm package (a
// transitive dep of `postcss-selector-parser`, used by `scopeCss` - swapped
// in via `alias` in `tsdown.config.ts`'s `compiler/browser` entry only).
// Node's real `util.deprecate(fn)` wraps `fn` to log a one-time warning;
// that warning is meaningless in a browser bundle, so this passes through.
module.exports = function deprecate(fn) {
  return fn;
};
