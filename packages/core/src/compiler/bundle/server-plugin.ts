import { isOutputTargetHydrate, isString, normalizeFsPath } from '@utils';
import { isAbsolute } from 'path';
import type { Plugin } from 'rollup';

import type * as d from '../../declarations';

export const serverPlugin = (config: d.ValidatedConfig, platform: string): Plugin => {
  const isHydrateBundle = platform === 'hydrate';
  const serverVarid = `@removed-server-code`;

  const isServerOnlyModule = (id: string) => {
    if (isString(id)) {
      id = normalizeFsPath(id);
      return id.includes('.server/') || id.endsWith('.server');
    }
    return false;
  };

  const externals = isHydrateBundle
    ? config.outputTargets.filter(isOutputTargetHydrate).flatMap((o) => o.external)
    : [];

  return {
    name: 'serverPlugin',

    resolveId(id, importer) {
      if (id === serverVarid) {
        return id;
      }
      if (isHydrateBundle) {
        if (externals.includes(id)) {
          // don't attempt to bundle node builtins for the hydrate bundle
          return {
            id,
            external: true,
          };
        }
        if (isServerOnlyModule(importer) && !id.startsWith('.') && !isAbsolute(id)) {
          // do not bundle if the importer is a server-only module
          // and the module it is importing is a node module
          return {
            id,
            external: true,
          };
        }
      } else {
        if (isServerOnlyModule(id)) {
          // any path that has .server in it shouldn't actually
          // be bundled in the web build, only the hydrate build
          return serverVarid;
        }
      }
      return null;
    },

    load(id) {
      if (id === serverVarid) {
        return {
          code: 'export default {};',
          syntheticNamedExports: true,
        };
      }
      return null;
    },
  };
};
