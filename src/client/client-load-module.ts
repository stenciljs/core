import * as d from '../declarations';
import { BUILD } from '@app-data';
import { consoleError } from './client-log';

export const cmpModules = /*@__PURE__*/new Map<string, {[exportName: string]: d.ComponentConstructor}>();

export const loadModule = (cmpMeta: d.ComponentRuntimeMeta, hostRef: d.HostRef, hmrVersionId?: string): Promise<d.ComponentConstructor> | d.ComponentConstructor => {
  // loadModuleImport
  const exportName = cmpMeta.$tagName$.replace(/-/g, '_');
  const bundleId = ((BUILD.mode && typeof cmpMeta.$lazyBundleIds$ !== 'string')
    ? cmpMeta.$lazyBundleIds$[hostRef.$modeName$]
    : cmpMeta.$lazyBundleIds$) as string;
  const module = !BUILD.hotModuleReplacement ? cmpModules.get(bundleId) : false;
  if (module) {
    return module[exportName];
  }
  return import(
    /* webpackInclude: /\.entry\.js$/ */
    /* webpackExclude: /\.system\.entry\.js$/ */
    /* webpackMode: "lazy" */
    `./${bundleId}.entry.js${BUILD.hotModuleReplacement && hmrVersionId ? '?s-hmr=' + hmrVersionId : ''}`
  ).then(importedModule => {
    if (!BUILD.hotModuleReplacement) {
      cmpModules.set(bundleId, importedModule);
    }
    return importedModule[exportName];
  }, consoleError);
};
