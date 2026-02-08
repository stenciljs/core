import { isRemoteUrl, join, normalizeFsPath, normalizePath } from '@utils';
import { dirname } from 'path';
import type { Plugin } from 'rollup';

import type * as d from '../../declarations';
import { HYDRATED_CSS } from '../../runtime/runtime-constants';
import { fetchModuleAsync } from '../sys/fetch/fetch-module-async';
import { getStencilModuleUrl, packageVersions } from '../sys/fetch/fetch-utils';
import {
  APP_DATA_CONDITIONAL,
  STENCIL_CORE_ID,
  STENCIL_INTERNAL_CLIENT_ID,
  STENCIL_INTERNAL_CLIENT_PATCH_BROWSER_ID,
  STENCIL_INTERNAL_HYDRATE_ID,
  STENCIL_INTERNAL_ID,
} from './entry-alias-ids';

export const coreResolvePlugin = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  platform: 'client' | 'hydrate' | 'worker',
  externalRuntime: boolean,
  lazyLoad: boolean,
): Plugin => {
  const compilerExe = config.sys.getCompilerExecutingPath();
  const internalClient = getStencilInternalModule(config, compilerExe, 'client/index.js');
  const internalClientPatchBrowser = getStencilInternalModule(config, compilerExe, 'client/patch-browser.js');
  const internalHydrate = getStencilInternalModule(config, compilerExe, 'hydrate/index.js');

  return {
    name: 'coreResolvePlugin',

    resolveId(id) {
      if (id === STENCIL_CORE_ID || id === STENCIL_INTERNAL_ID) {
        if (platform === 'client') {
          if (externalRuntime) {
            return {
              id: STENCIL_INTERNAL_CLIENT_ID,
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
      if (id === STENCIL_INTERNAL_CLIENT_ID) {
        if (externalRuntime) {
          // not bundling the client runtime and the user's component together this
          // must be the custom elements build, where @stencil/core/internal/client
          // is an import, rather than bundling
          return {
            id: STENCIL_INTERNAL_CLIENT_ID,
            external: true,
          };
        }
        // importing @stencil/core/internal/client directly, so it shouldn't get
        // the custom app-data conditionals
        return internalClient;
      }
      if (id === STENCIL_INTERNAL_CLIENT_PATCH_BROWSER_ID) {
        if (externalRuntime) {
          return {
            id: STENCIL_INTERNAL_CLIENT_PATCH_BROWSER_ID,
            external: true,
          };
        }
        return internalClientPatchBrowser;
      }
      if (id === STENCIL_INTERNAL_HYDRATE_ID) {
        return internalHydrate;
      }
      return null;
    },

    async load(filePath) {
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
          let code = await compilerCtx.fs.readFile(filePath);

          if (typeof code !== 'string' && isRemoteUrl(compilerExe)) {
            const url = getStencilModuleUrl(compilerExe, filePath);
            code = await fetchModuleAsync(config.sys, compilerCtx.fs, packageVersions, url, filePath);
          }

          if (typeof code === 'string') {
            const hydratedFlag = config.hydratedFlag;
            if (hydratedFlag) {
              const hydratedFlagHead = getHydratedFlagHead(hydratedFlag);
              if (HYDRATED_CSS !== hydratedFlagHead) {
                code = code.replace(HYDRATED_CSS, hydratedFlagHead);
                if (hydratedFlag.name !== 'hydrated') {
                  code = code.replace(`.classList.add("hydrated")`, `.classList.add("${hydratedFlag.name}")`);
                  code = code.replace(`.classList.add('hydrated')`, `.classList.add('${hydratedFlag.name}')`);
                  code = code.replace(`.setAttribute("hydrated",`, `.setAttribute("${hydratedFlag.name}",`);
                  code = code.replace(`.setAttribute('hydrated',`, `.setAttribute('${hydratedFlag.name}',`);
                }
              }
            } else {
              code = code.replace(HYDRATED_CSS, '{}');
            }
          }

          return code;
        }
      }
      return null;
    },
  };
};

export const getStencilInternalModule = (config: d.ValidatedConfig, compilerExe: string, internalModule: string) => {
  if (isRemoteUrl(compilerExe)) {
    return normalizePath(
      config.sys.getLocalModulePath({
        rootDir: config.rootDir,
        moduleId: '@stencil/core',
        path: 'internal/' + internalModule,
      }),
    );
  }

  const compilerExeDir = dirname(compilerExe);
  return normalizePath(join(compilerExeDir, '..', 'internal', internalModule));
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
