import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Build-time constants (baked in during Stencil build via tsdown define)
// These identifiers are replaced with string values at build time
declare const __STENCIL_VERSION__: string;
declare const __STENCIL_BUILD_ID__: string;
declare const __STENCIL_VERMOJI__: string;

export const version: string = __STENCIL_VERSION__;
export const buildId: string = __STENCIL_BUILD_ID__;
export const vermoji: string = __STENCIL_VERMOJI__;

/**
 * Get the installed version of a tool/dependency.
 * Handles packages with exports maps that point to subdirectories.
 * Returns 'unknown' if the package is not found.
 */
export function getToolVersion(name: string): string {
  try {
    // Resolve the package entry point
    const entryUrl = import.meta.resolve(name);
    const entryPath = fileURLToPath(entryUrl);

    // Walk up directories to find the root package.json with matching name and version
    let dir = dirname(entryPath);
    while (dir !== dirname(dir)) {
      const pkgPath = join(dir, 'package.json');
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        if (pkg.name === name && pkg.version) {
          return pkg.version;
        }
      } catch {
        // No package.json here, keep looking
      }
      dir = dirname(dir);
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Runtime versions object with lazy getters.
 * Reads actual installed package versions rather than build-time baked values.
 */
export const versions = {
  get stencil() {
    return version;
  },
  get typescript() {
    return getToolVersion('typescript');
  },
  get rollup() {
    return getToolVersion('rollup');
  },
  get terser() {
    return getToolVersion('terser');
  },
};
