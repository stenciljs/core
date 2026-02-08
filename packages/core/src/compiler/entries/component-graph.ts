import type * as d from '../../declarations';
import { getScopeId } from '../style/scope-css';

export const generateModuleGraph = (cmps: d.ComponentCompilerMeta[], bundleModules: ReadonlyArray<d.BundleModule>) => {
  const cmpMap = new Map<string, string[]>();
  cmps.forEach((cmp) => {
    const bundle = bundleModules.find((b) => b.cmps.includes(cmp));
    if (bundle) {
      // add default case for no mode
      cmpMap.set(getScopeId(cmp.tagName), bundle.rollupResult.imports);
    }
  });

  return cmpMap;
};
