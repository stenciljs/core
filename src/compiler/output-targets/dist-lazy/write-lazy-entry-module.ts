import { getSourceMappingUrlForEndOfFile, join } from '@utils';

import type * as d from '../../../declarations';

export const writeLazyModule = async (
  compilerCtx: d.CompilerCtx,
  outputTargetType: string,
  destinations: string[],
  code: string,
  sourceMap: d.SourceMap,
  rollupResult?: d.RollupChunkResult,
): Promise<d.BundleModuleOutput> => {
  // code = replaceStylePlaceholders(entryModule.cmps, modeName, code);

  const fileName = rollupResult.fileName;
  const bundleId = fileName.replace('.entry.js', '');

  if (sourceMap) {
    code = code + getSourceMappingUrlForEndOfFile(fileName);
  }

  await Promise.all(
    destinations.map((dst) => {
      compilerCtx.fs.writeFile(join(dst, fileName), code, { outputTargetType });
      if (!!sourceMap) {
        compilerCtx.fs.writeFile(join(dst, fileName) + '.map', JSON.stringify(sourceMap), { outputTargetType });
      }
    }),
  );

  return {
    bundleId,
    fileName,
    code,
  };
};
