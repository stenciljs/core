import { BUILD } from '@app-data';

import type * as d from '../declarations';
import { consoleDevError, consoleError } from './client-log';

export const cmpModules = /*@__PURE__*/ new Map<string, { [exportName: string]: d.ComponentConstructor }>();

export const loadModule = (
  cmpMeta: d.ComponentRuntimeMeta,
  hostRef: d.HostRef,
  hmrVersionId?: string,
): Promise<d.ComponentConstructor | undefined> | d.ComponentConstructor | undefined => {
  // loadModuleImport
  const exportName = cmpMeta.$tagName$.replace(/-/g, '_');
  const bundleId = cmpMeta.$lazyBundleId$;
  if (BUILD.isDev && typeof bundleId !== 'string') {
    consoleDevError(
      `Trying to lazily load component <${cmpMeta.$tagName$}> with style mode "${hostRef.$modeName$}", but it does not exist.`,
    );
    return undefined;
  } else if (!bundleId) {
    return undefined;
  }
  const module = !BUILD.hotModuleReplacement ? cmpModules.get(bundleId) : false;
  if (module) {
    return module[exportName];
  }
  /*!__STENCIL_STATIC_IMPORT_SWITCH__*/

  // Esbuild will try to statically match a path string inside an import statement.
  // By putting dynamicImportPath into a variable, it can stay dynamic.
  // For details: https://esbuild.github.io/api/#non-analyzable-imports
  const hmr = BUILD.hotModuleReplacement && hmrVersionId ? '?s-hmr=' + hmrVersionId : '';
  const dynamicImportPath = `./${bundleId}.entry.js${hmr}`;
  return import(
    /* @vite-ignore */
    /* webpackInclude: /\.entry\.js$/ */
    /* webpackExclude: /\.system\.entry\.js$/ */
    /* webpackMode: "lazy" */
    dynamicImportPath
  ).then(
    (importedModule) => {
      if (!BUILD.hotModuleReplacement) {
        cmpModules.set(bundleId, importedModule);
      }
      return importedModule[exportName];
    },
    (e: Error) => {
      consoleError(e, hostRef.$hostElement$);
    },
  );
};
