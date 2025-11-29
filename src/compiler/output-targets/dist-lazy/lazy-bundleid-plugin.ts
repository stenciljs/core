import MagicString from 'magic-string';

import type { OutputChunk, Plugin } from 'rollup';
import type * as d from '../../../declarations';

/**
 * A Rollup plugin to generate unique bundle IDs for lazy-loaded modules.
 * @param buildCtx The build context
 * @param config The validated configuration
 * @param shouldHash Whether to hash the bundle ID
 * @param suffix The suffix to append to the bundle ID
 * @returns A Rollup plugin
 */
export const lazyBundleIdPlugin = (
  buildCtx: d.BuildCtx,
  config: d.ValidatedConfig,
  shouldHash: boolean,
  suffix: string,
): Plugin => {
  const getBundleId = async (entryKey: string, code: string, suffix: string): Promise<string> => {
    if (shouldHash && config.sys?.generateContentHash) {
      const hash = await config.sys.generateContentHash(code, config.hashedFileNameLength);
      return `p-${hash}${suffix}`;
    }

    const components = entryKey.split('.');
    let bundleId = components[0];
    if (components.length > 2) {
      bundleId = `${bundleId}_${components.length - 1}`;
    }

    return bundleId + suffix;
  };

  return {
    name: 'lazyBundleIdPlugin',
    async generateBundle(_, bundle) {
      const files = Object.entries<OutputChunk>(bundle as any);
      const map = new Map<string, string>();
      const filesToDelete: string[] = [];

      // For browser builds, loader entries are skipped by writeLazyEntry
      // So we need to delete their sourcemaps to avoid orphaned files
      if (suffix && config.sourceMap) {
        for (const [key, file] of files) {
          if (file.type === 'chunk' && file.isEntry && file.name === 'loader') {
            const mapFileName = key + '.map';
            if (bundle[mapFileName]) {
              filesToDelete.push(mapFileName);
            }
          }
        }
      }

      for (const [_key, file] of files) {
        if (!file.isEntry) continue;

        const entryModule = buildCtx.entryModules.find((em) => em.entryKey === file.name);
        if (!entryModule) continue;

        const newFileName = (await getBundleId(file.name, file.code, suffix)) + '.entry.js';
        map.set(file.fileName, newFileName);

        // If we're renaming the file, mark the old sourcemap for deletion
        if (file.fileName !== newFileName && config.sourceMap) {
          const oldMapFileName = file.fileName + '.map';
          if (bundle[oldMapFileName]) {
            filesToDelete.push(oldMapFileName);
          }
        }
      }

      if (!map.size) return;

      for (const [_key, file] of files) {
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

        if (config.sourceMap) {
          file.map = magicString.generateMap();
        }
      }

      // Delete orphaned sourcemap files
      for (const fileName of filesToDelete) {
        delete bundle[fileName];
      }
    },
  };
};
