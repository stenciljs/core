import { isAbsolute } from 'path';
import type * as d from '@stencil/core';
import type { Plugin } from 'rolldown';

import { isOutputTargetHydrate, isString, normalizeFsPath } from '../../utils';
import type { BundlePlatform } from './bundle-interface';

// Escape special regex characters
const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const serverPlugin = (config: d.ValidatedConfig, platform: BundlePlatform): Plugin => {
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

  // Build filter based on what this plugin handles:
  // - @removed-server-code (virtual module)
  // - .server paths (for client builds)
  // - externals (for hydrate builds)
  const filterPatterns = [escapeRegex(serverVarid), '\\.server'];
  if (externals.length > 0) {
    filterPatterns.push(...externals.map(escapeRegex));
  }
  const resolveFilter = new RegExp(`(${filterPatterns.join('|')})`);

  return {
    name: 'serverPlugin',

    resolveId: {
      filter: { id: resolveFilter },
      handler(id, importer) {
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
    },

    load: {
      filter: { id: /^@removed-server-code$/ },
      handler(id) {
        if (id === serverVarid) {
          return {
            code: 'export default {};',
            syntheticNamedExports: true,
          };
        }
        return null;
      },
    },
  };
};
