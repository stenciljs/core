import MagicString from 'magic-string';

import type { OutputChunk, Plugin } from 'rollup';
import type * as d from '../../../declarations';

/**
 * A Rollup plugin to generate unique bundle IDs for lazy-loaded modules.
 * @param config The validated configuration
 * @param isBrowserBuild Whether this is a browser build
 * @returns A Rollup plugin
 */
export const lazyBundleIdPlugin = (
  config: d.ValidatedConfig,
  isBrowserBuild?: boolean,
): Plugin => {
  return {
    name: 'lazyBundleIdPlugin',
    async generateBundle(_, bundle) {
      const files = Object.entries<OutputChunk>(bundle as any);
      const map = new Map<string, string>();
      const filesToDelete: string[] = [];

      // For browser builds, loader entries are skipped by writeLazyEntry
      // So we need to delete their sourcemaps to avoid orphaned files
      if (isBrowserBuild && config.sourceMap) {
        for (const [key, file] of files) {
          if (file.type === 'chunk' && file.isEntry && file.name === 'loader') {
            const mapFileName = key + '.map';
            if (bundle[mapFileName]) {
              filesToDelete.push(mapFileName);
            }
          }
        }
      }

      // Delete orphaned sourcemap files before early return
      for (const fileName of filesToDelete) {
        delete bundle[fileName];
      }

      if (!map.size) return;

      for (const [, file] of files) {
        if (!file.isEntry) continue;

        const newFileName = map.get(file.fileName);
        if (!newFileName) continue;

        file.facadeModuleId = newFileName;
        file.fileName = newFileName;

        const magicString = new MagicString(file.code);

        file.imports.forEach((imported: string, i) => {
          const replaced = map.get(imported);
          if (replaced) {
            magicString.replaceAll(imported, replaced);
            file.imports[i] = replaced;
          }
        });
        file.code = magicString.toString();

        if (config.sourceMap && file.map) {
          // Update the file name in the existing sourcemap,
          // preserving the original mappings
          file.map.file = newFileName;
        }
      }
    },
  };
};
