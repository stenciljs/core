import { dirname } from 'path';
import type * as d from '@stencil/core';
import type { Plugin } from 'rolldown';

import { HYDRATED_CSS } from '../../runtime/runtime-constants';
import { isRemoteUrl, join, normalizeFsPath, normalizePath } from '../../utils';
import { fetchModuleAsync } from '../sys/fetch/fetch-module-async';
import { getStencilModuleUrl, packageVersions } from '../sys/fetch/fetch-utils';
import {
  APP_DATA_CONDITIONAL,
  STENCIL_CORE_ID,
  STENCIL_INTERNAL_CLIENT_PLATFORM_ID,
  STENCIL_INTERNAL_HYDRATE_PLATFORM_ID,
  STENCIL_INTERNAL_ID,
  STENCIL_JSX_DEV_RUNTIME_ID,
  STENCIL_JSX_RUNTIME_ID,
} from './entry-alias-ids';
import type { BundlePlatform } from './bundle-interface';

export const coreResolvePlugin = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  platform: BundlePlatform,
  externalRuntime: boolean,
  lazyLoad: boolean,
): Plugin => {
  const compilerExe = config.sys.getCompilerExecutingPath();
  const internalClient = getStencilInternalModule(config, compilerExe, 'client/index.js');
  const internalHydrate = getStencilInternalModule(config, compilerExe, 'server/index.mjs');

  // Cache transformed file content - the hydrated flag replacements are deterministic
  const transformedCodeCache = new Map<string, string>();

  // Pre-compute hydrated flag replacement info once
  const hydratedFlag = config.hydratedFlag;
  const hydratedFlagHead = hydratedFlag ? getHydratedFlagHead(hydratedFlag) : null;
  const hydratedReplacements: Array<[string, string]> | null =
    hydratedFlag && hydratedFlagHead !== HYDRATED_CSS
      ? buildHydratedReplacements(hydratedFlag, hydratedFlagHead)
      : null;

  // Build filter for load hook - only process the internal client/hydrate runtime files
  const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const loadFilter = new RegExp(
    `^(${escapeRegex(internalClient)}|${escapeRegex(internalHydrate)})$`,
  );

  return {
    name: 'coreResolvePlugin',

    // Use Rolldown's hook filter to only call this plugin for @stencil/core imports
    // This avoids JS<->Rust boundary crossing for every import in the bundle
    resolveId: {
      filter: { id: /^@stencil\/core/ },
      handler(id) {
        if (id === STENCIL_CORE_ID || id === STENCIL_INTERNAL_ID) {
          if (platform === 'client') {
            if (externalRuntime) {
              return {
                id: STENCIL_INTERNAL_CLIENT_PLATFORM_ID,
                external: true,
              };
            }
            if (lazyLoad) {
              // with a lazy / dist build, add `?app-data=conditional` as an identifier to ensure we don't
              // use the default app-data, but build a custom one based on component meta
              return internalClient + APP_DATA_CONDITIONAL;
            }
            // for a non-lazy / dist-custom-elements build, use the default, complete core.
            // This ensures all features are available for any importer library
            return internalClient;
          }
          if (platform === 'hydrate') {
            return internalHydrate;
          }
        }
        if (id === STENCIL_INTERNAL_CLIENT_PLATFORM_ID) {
          if (externalRuntime) {
            // not bundling the client runtime and the user's component together this
            // must be the custom elements build, where @stencil/core/runtime/client
            // is an import, rather than bundling
            return {
              id: STENCIL_INTERNAL_CLIENT_PLATFORM_ID,
              external: true,
            };
          }
          // importing @stencil/core/runtime/client directly, so it shouldn't get
          // the custom app-data conditionals
          return internalClient;
        }
        if (id === STENCIL_INTERNAL_HYDRATE_PLATFORM_ID) {
          return internalHydrate;
        }
        // Handle jsx-runtime and jsx-dev-runtime imports
        // These must resolve to the same internal client path as @stencil/core
        // to prevent Rolldown from bundling duplicate runtime code with different
        // minified property names, which causes VNode property mismatches during hydration
        if (id === STENCIL_JSX_RUNTIME_ID || id === STENCIL_JSX_DEV_RUNTIME_ID) {
          if (platform === 'client') {
            if (externalRuntime) {
              return {
                id: STENCIL_INTERNAL_CLIENT_PLATFORM_ID,
                external: true,
              };
            }
            if (lazyLoad) {
              // with a lazy / dist build, add `?app-data=conditional` as an identifier to ensure we don't
              // use the default app-data, but build a custom one based on component meta
              return internalClient + APP_DATA_CONDITIONAL;
            }
            // for a non-lazy / dist-custom-elements build, use the default, complete core.
            return internalClient;
          }
          if (platform === 'hydrate') {
            return internalHydrate;
          }
        }
        return null;
      },
    },

    load: {
      filter: { id: loadFilter },
      async handler(filePath) {
        if (filePath && !filePath.startsWith('\0')) {
          filePath = normalizeFsPath(filePath);

          if (filePath === internalClient || filePath === internalHydrate) {
            if (platform === 'worker') {
              return `
export const Build = {
  isDev: ${config.devMode},
  isBrowser: true,
  isServer: false,
  isTesting: false,
};`;
            }

            // Check cache first - transformed content is deterministic per file
            const cached = transformedCodeCache.get(filePath);
            if (cached) {
              return cached;
            }

            let code = await compilerCtx.fs.readFile(filePath);

            if (typeof code !== 'string' && isRemoteUrl(compilerExe)) {
              const url = getStencilModuleUrl(compilerExe, filePath);
              code = await fetchModuleAsync(
                config.sys,
                compilerCtx.fs,
                packageVersions,
                url,
                filePath,
              );
            }

            if (typeof code === 'string') {
              // Apply pre-computed hydrated flag replacements in a single pass
              if (hydratedReplacements) {
                for (const [search, replace] of hydratedReplacements) {
                  code = code.replace(search, replace);
                }
              } else if (!hydratedFlag) {
                code = code.replace(HYDRATED_CSS, '{}');
              }

              // Cache the transformed result
              transformedCodeCache.set(filePath, code);
            }

            return code;
          }
        }
        return null;
      },
    },
  };
};

export const getStencilInternalModule = (
  config: d.ValidatedConfig,
  compilerExe: string,
  internalModule: string,
) => {
  if (isRemoteUrl(compilerExe)) {
    return normalizePath(
      config.sys.getLocalModulePath({
        rootDir: config.rootDir,
        moduleId: '@stencil/core',
        path: 'runtime/' + internalModule,
      }),
    );
  }

  const compilerExeDir = dirname(compilerExe);
  return normalizePath(join(compilerExeDir, '..', 'runtime', internalModule));
};

export const getHydratedFlagHead = (h: d.HydratedFlag) => {
  // {visibility:hidden}.hydrated{visibility:inherit}

  let initial: string;
  let hydrated: string;

  if (!String(h.initialValue) || h.initialValue === '' || h.initialValue == null) {
    initial = '';
  } else {
    initial = `{${h.property}:${h.initialValue}}`;
  }

  const selector = h.selector === 'attribute' ? `[${h.name}]` : `.${h.name}`;

  if (!String(h.hydratedValue) || h.hydratedValue === '' || h.hydratedValue == null) {
    hydrated = '';
  } else {
    hydrated = `${selector}{${h.property}:${h.hydratedValue}}`;
  }

  return initial + hydrated;
};

/**
 * Pre-build all hydrated flag string replacements to avoid repeated computation.
 * Returns an array of [search, replace] tuples to apply in sequence.
 * @param hydratedFlag the hydrated flag configuration
 * @param hydratedFlagHead the pre-computed CSS string for the hydrated flag
 * @returns an array of [search, replace] tuples for string replacement
 */
const buildHydratedReplacements = (
  hydratedFlag: d.HydratedFlag,
  hydratedFlagHead: string,
): Array<[string, string]> => {
  const replacements: Array<[string, string]> = [[HYDRATED_CSS, hydratedFlagHead]];

  if (hydratedFlag.name !== 'hydrated') {
    replacements.push(
      [`.classList.add("hydrated")`, `.classList.add("${hydratedFlag.name}")`],
      [`.classList.add('hydrated')`, `.classList.add('${hydratedFlag.name}')`],
      [`.setAttribute("hydrated",`, `.setAttribute("${hydratedFlag.name}",`],
      [`.setAttribute('hydrated',`, `.setAttribute('${hydratedFlag.name}',`],
    );
  }

  return replacements;
};
