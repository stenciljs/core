import type { OutputAsset, OutputChunk, OutputOptions, RollupBuild } from 'rollup';

import type * as d from '@stencil/core';
import { STENCIL_CORE_ID } from '../bundle/entry-alias-ids';

/**
 * Generate rollup output based on a rollup build and a series of options.
 *
 * @param build a rollup build
 * @param options output options for rollup
 * @param config a user-supplied configuration object
 * @param entryModules a list of entry modules, for checking which chunks
 * contain components
 * @returns a Promise wrapping either build results or `null`
 */
export const generateRollupOutput = async (
  build: RollupBuild,
  options: OutputOptions,
  config: d.ValidatedConfig,
  entryModules: d.EntryModule[],
): Promise<d.RollupResult[] | null> => {
  if (build == null) {
    return null;
  }

  const { output }: { output: [OutputChunk, ...(OutputChunk | OutputAsset)[]] } = await build.generate(options);
  return output.map((chunk: OutputChunk | OutputAsset) => {
    if (chunk.type === 'chunk') {
      const isCore = Object.keys(chunk.modules).some((m) => m.includes(STENCIL_CORE_ID));
      return {
        type: 'chunk',
        fileName: chunk.fileName,
        map: chunk.map
          ? {
              ...chunk.map,
              sourcesContent: chunk.map.sourcesContent || [],
            }
          : undefined,
        code: chunk.code,
        moduleFormat: options.format,
        entryKey: chunk.name,
        imports: chunk.imports,
        isEntry: !!chunk.isEntry,
        isComponent: !!chunk.isEntry && entryModules.some((m) => m.entryKey === chunk.name),
        isBrowserLoader: chunk.isEntry && chunk.name === config.fsNamespace,
        isIndex: chunk.isEntry && chunk.name === 'index',
        isCore,
      };
    } else {
      return {
        type: 'asset',
        fileName: chunk.fileName,
        content: chunk.source as any,
      };
    }
  });
};
