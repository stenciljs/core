import { relative } from 'node:path';
import {
  isOutputTargetDistLazy,
  isOutputTargetStandalone,
  isOutputTargetWww,
  normalizePath,
} from '@stencil/core/compiler/utils';
import type { ValidatedConfig } from '@stencil/core/compiler';

/**
 * Resolves the server-relative src for the project's browser entry bundle, from validated
 * output targets alone (no build required) - the same dev-mode, unhashed filename conventions
 * the compiler itself uses (see `getAbsoluteBuildDir` in `packages/core/src/compiler/html/html-utils.ts`
 * and the dev server's `getLoaderUrl` in `packages/dev-server/src/server/dev-preview.ts`, which
 * this mirrors for use before a build has happened).
 *
 * Preference order matches what actually gets built:
 * 1. `www` - always emits its own entry bundle at `{buildDir}/{fsNamespace}.js`, regardless of
 *    `bundleMode`, so it's resolved directly from the `www` target rather than the `dist-lazy` /
 *    `standalone` target it internally synthesizes.
 * 2. `loader-bundle` (no `www`) - synthesizes a `dist-lazy` build for CDN usage, servable from
 *    the project root when there's no `www` target to claim the server root instead.
 * 3. `standalone` with `autoLoader` enabled (the default) - falls back to its auto-loader script.
 *
 * Returns `null` if the project has no browser-loadable output target at all (e.g. an SSR-only
 * project) - the caller should omit the script tag in that case.
 *
 * @param config - Validated Stencil config.
 * @returns Server-relative script src, or `null` if none of the configured output targets
 * produce a browser-loadable entry.
 */
export function resolveEntryScriptSrc(config: ValidatedConfig): string | null {
  const outputTargets = config.outputTargets;

  const wwwTarget = outputTargets.find(isOutputTargetWww);
  if (wwwTarget?.dir && wwwTarget.buildDir) {
    return toUrl(wwwTarget.dir, wwwTarget.buildDir, `${config.fsNamespace}.js`);
  }

  // No www - servable from the project root instead
  const distLazyTarget = outputTargets.find(isOutputTargetDistLazy);
  const distLazyDir = distLazyTarget?.esmDir ?? distLazyTarget?.dir;
  if (distLazyDir) {
    return toUrl(config.rootDir, distLazyDir, `${config.fsNamespace}.js`);
  }

  const standaloneTarget = outputTargets.find(isOutputTargetStandalone);
  if (standaloneTarget?.dir && standaloneTarget.autoLoader !== false) {
    const fileName =
      typeof standaloneTarget.autoLoader === 'object'
        ? standaloneTarget.autoLoader.fileName || 'loader'
        : 'loader';
    return toUrl(config.rootDir, standaloneTarget.dir, `${fileName}.js`);
  }

  return null;
}

function toUrl(base: string, dir: string, fileName: string): string {
  // relativize=false: this is a URL path, not a module specifier - no leading `./`
  const relativeDir = normalizePath(relative(base, dir), false);
  return `/${relativeDir ? `${relativeDir}/` : ''}${fileName}`;
}
