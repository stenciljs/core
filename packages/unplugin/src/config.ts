/**
 * Stencil config auto-detection for @stencil/unplugin.
 *
 * Searches for a `stencil.config.ts` (or `.js` variant) in the project root,
 * loads it via jiti (so TypeScript is handled without a separate compile step),
 * and extracts the subset of flags that are meaningful at transpile time.
 *
 * `stencilConfigToOverrides` converts that subset to a `BuildOverrides` object
 * ready to pass to `transpileSync`.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { BuildOverrides, LightDomPatches } from '@stencil/core/compiler';

import type { StencilConfigSubset } from './options.js';

// A real Stencil config always has at least one of these keys. Used to
// distinguish an actual default-exported config from jiti's CJS interop
// artefact where the module namespace itself lands on `mod.default`.
const STENCIL_CONFIG_KEYS = new Set([
  'namespace',
  'srcDir',
  'outputTargets',
  'plugins',
  'signalBacking',
  'compat',
]);

const looksLikeConfig = (v: unknown): v is Record<string, unknown> =>
  v !== null &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  Object.keys(v as object).some((k) => STENCIL_CONFIG_KEYS.has(k));

const CONFIG_CANDIDATES = [
  'stencil.config.ts',
  'stencil.config.mts',
  'stencil.config.js',
  'stencil.config.mjs',
];

/**
 * Attempt to load the project's `stencil.config.ts` and return the
 * transpile-relevant fields. Returns `null` if no config file is found or
 * if loading fails for any reason.
 * @param cwd - project root to search in (usually `process.cwd()`)
 * @returns a subset of the Stencil config, or `null` if none is found
 */
export async function loadStencilConfig(cwd: string): Promise<StencilConfigSubset | null> {
  for (const filename of CONFIG_CANDIDATES) {
    const configPath = join(cwd, filename);
    if (!existsSync(configPath)) continue;
    try {
      const { createJiti } = await import('jiti');
      const jiti = createJiti(import.meta.url);
      const mod = (await jiti.import(configPath)) as Record<string, unknown>;
      // Named `config` export is the Stencil convention; fall back to a default
      // export only when it looks like a real config object (has at least one
      // known Stencil key) — otherwise jiti's CJS interop may surface the
      // module namespace object as `default`, which we must not treat as config.
      const raw = mod['config'] ?? (looksLikeConfig(mod['default']) ? mod['default'] : null);
      if (!raw || typeof raw !== 'object') return null;
      return extractSubset(raw as Record<string, unknown>);
    } catch {
      return null;
    }
  }
  return null;
}

function extractSubset(c: Record<string, unknown>): StencilConfigSubset {
  const result: StencilConfigSubset = {};
  if (c['signalBacking'] === true) result.signalBacking = true;
  const compat = c['compat'];
  if (compat && typeof compat === 'object') {
    const co = compat as Record<string, unknown>;
    const ldp = co['lightDomPatches'];
    const lifecycleDOMEvents = co['lifecycleDOMEvents'];
    const initializeNextTick = co['initializeNextTick'];
    if (ldp !== undefined || lifecycleDOMEvents !== undefined || initializeNextTick !== undefined) {
      result.compat = {};
      if (typeof ldp === 'boolean') result.compat.lightDomPatches = ldp;
      else if (ldp && typeof ldp === 'object')
        result.compat.lightDomPatches = ldp as LightDomPatches;
      if (lifecycleDOMEvents === true) result.compat.lifecycleDOMEvents = true;
      if (initializeNextTick === true) result.compat.initializeNextTick = true;
    }
  }
  return result;
}

/**
 * Convert a {@link StencilConfigSubset} to a {@link BuildOverrides} object.
 * The caller is responsible for merging this with any explicit
 * `transpileOptions.buildOverrides` (which should take precedence).
 * @param config - the Stencil config subset to convert
 * @returns a `BuildOverrides` object suitable for passing to `transpileSync`
 */
export function stencilConfigToOverrides(config: StencilConfigSubset): BuildOverrides {
  const o: BuildOverrides = {};
  if (config.signalBacking) {
    o.signalBacking = true;
    o.vdomSignals = true; // signalBacking implies vdomSignals
  }

  const compat = config.compat;
  if (!compat) return o;
  if (compat.lifecycleDOMEvents) o.lifecycleDOMEvents = true;
  if (compat.initializeNextTick) o.initializeNextTick = true;

  const ldp = compat.lightDomPatches;
  if (ldp === false) {
    // Explicitly disable — standalone runtime defaults all to true.
    o.lightDomPatches = false;
    o.slotChildNodes = false;
    o.slotCloneNode = false;
    o.slotDomMutations = false;
    o.slotTextContent = false;
  } else if (typeof ldp === 'object') {
    // Granular: enable only the named patches; disable the rest (defaults are all-true).
    o.lightDomPatches = true;
    o.slotChildNodes = !!ldp.childNodes;
    o.slotCloneNode = !!ldp.cloneNode;
    o.slotDomMutations = !!ldp.domMutations;
    o.slotTextContent = !!ldp.textContent;
  }
  // ldp === true or undefined: no-op — already the default in the standalone runtime.
  return o;
}
