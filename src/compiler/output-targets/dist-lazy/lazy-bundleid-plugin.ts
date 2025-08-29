import MagicString from 'magic-string';

import type { OutputChunk, Plugin } from 'rollup';
import type * as d from '../../../declarations';

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

      for (const [_key, file] of files) {
        if (!file.isEntry) continue;

        const entryModule = buildCtx.entryModules.find((em) => em.entryKey === file.name);
        if (!entryModule) continue;

        map.set(file.fileName, (await getBundleId(file.name, file.code, suffix)) + '.entry.js');
      }

      if (!map.size) return;

      for (const [_key, file] of files) {
        if (!file.isEntry) continue;

        file.facadeModuleId = map.get(file.fileName) || file.facadeModuleId;
        file.fileName = map.get(file.fileName) || file.fileName;

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
    },
  };
};
