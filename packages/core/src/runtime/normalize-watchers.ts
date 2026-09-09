import type * as d from '@stencil/core';

/**
 * Normalizes watcher metadata to the current `{ [methodName]: flags }[]` format.
 *
 * Prior to Stencil 4.39.x (PR #6484), the `@Watch()` compiler emitted watcher
 * handlers as a plain string array: `{ "min": ["minChanged"] }`. The new format
 * wraps each entry in an object that carries option flags (e.g. `immediate`):
 * `{ "min": [{ "minChanged": 0 }] }`.
 *
 * When a library (e.g. Ionic Framework) was compiled with an older Stencil compiler
 * but consumed by an app using a newer Stencil runtime, the runtime's
 * `Object.entries(watcher)` call receives a string and misinterprets its character
 * indices as method names, causing:
 *   `TypeError: instance[watchMethodName] is not a function`
 *
 * This helper should be used at `$watchers$` assignment sites that need to
 * accept both legacy and current compiler metadata so downstream code on those
 * paths can safely assume the new object format.
 *
 * @param raw The raw watcher map from compiled metadata (new or legacy format).
 * @returns A normalized watcher map in the `{ [methodName]: flags }[]` format, or `undefined` if `raw` is `undefined` or empty.
 */
export const normalizeWatchers = (
  raw: d.ComponentConstructorChangeHandlers | undefined,
): d.ComponentConstructorChangeHandlers | undefined => {
  if (!raw) return undefined;
  const keys = Object.keys(raw);
  if (keys.length === 0) return undefined;

  // Fast path: if no entry contains a legacy string handler, return the
  // original reference to avoid allocating new objects during bootstrap.
  let hasLegacy = false;
  for (const propName of keys) {
    if (hasLegacy) break;
    for (const h of raw[propName] as any[]) {
      if (typeof h === 'string') {
        hasLegacy = true;
        break;
      }
    }
  }
  if (!hasLegacy) return raw;

  const out: d.ComponentConstructorChangeHandlers = {};
  for (const propName of keys) {
    out[propName] = (raw[propName] as any[]).map((h: string | { [key: string]: number }) =>
      typeof h === 'string' ? { [h]: 0 } : h,
    );
  }
  return out;
};
