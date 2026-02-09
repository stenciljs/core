import type { Plugin } from 'vite';
import { resolve } from 'path';

/**
 * Virtual module IDs following Vite's convention
 * @see https://vite.dev/guide/api-plugin#virtual-modules-convention
 */
const VIRTUAL_MODULES = {
  'virtual:app-data': 'app-data',
  'virtual:app-globals': 'app-globals',
  'virtual:platform': 'platform',
} as const;

type VirtualModuleId = keyof typeof VIRTUAL_MODULES;

interface VirtualModulesOptions {
  /**
   * Resolution map for virtual modules.
   * Maps virtual module names to their actual file paths.
   */
  resolve?: {
    'app-data'?: string;
    'app-globals'?: string;
    'platform'?: string;
  };
  /**
   * Virtual modules to externalize (not resolve, keep as imports).
   * These will be rewritten to their output paths in the bundle.
   */
  external?: {
    'app-data'?: string;
    'app-globals'?: string;
    'platform'?: string;
  };
}

/**
 * Vite plugin for Stencil virtual modules.
 *
 * Handles virtual:app-data, virtual:app-globals, and virtual:platform
 * following Vite's virtual module convention with \0 prefix.
 */
export function stencilVirtualModules(options: VirtualModulesOptions): Plugin {
  const resolveMap = new Map<string, string>();
  const externalMap = new Map<string, string>();

  // Build resolution map
  for (const [virtualId, shortName] of Object.entries(VIRTUAL_MODULES)) {
    const resolvePath = options.resolve?.[shortName as keyof NonNullable<VirtualModulesOptions['resolve']>];
    if (resolvePath) {
      resolveMap.set(virtualId, resolvePath);
    }
    const externalPath = options.external?.[shortName as keyof NonNullable<VirtualModulesOptions['external']>];
    if (externalPath) {
      externalMap.set(virtualId, externalPath);
    }
  }

  return {
    name: 'stencil-virtual-modules',

    resolveId(id) {
      // Handle virtual module resolution
      if (id in VIRTUAL_MODULES) {
        // Check if this should be externalized
        if (externalMap.has(id)) {
          return { id: externalMap.get(id)!, external: true };
        }
        // Check if we have a resolution path
        if (resolveMap.has(id)) {
          // Return with \0 prefix per Vite convention
          return '\0' + id;
        }
      }
      return null;
    },

    load(id) {
      // Handle loading of virtual modules (prefixed with \0)
      for (const virtualId of Object.keys(VIRTUAL_MODULES) as VirtualModuleId[]) {
        if (id === '\0' + virtualId) {
          const resolvedPath = resolveMap.get(virtualId);
          if (resolvedPath) {
            // Re-export from the actual file
            return `export * from '${resolvedPath}';`;
          }
        }
      }
      return null;
    },
  };
}

/**
 * Helper to get the default resolution paths relative to packages/core
 */
export function getDefaultPaths(dirname: string) {
  return {
    appData: resolve(dirname, 'src/app-data/index.ts'),
    appGlobals: resolve(dirname, 'src/app-globals/index.ts'),
    client: resolve(dirname, 'src/client/index.ts'),
    server: resolve(dirname, 'src/server/platform/index.ts'),
  };
}
