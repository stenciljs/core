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
      const jsPath = join(dst, fileName);
      const mapPath = jsPath + '.map';
      const writes: Promise<any>[] = [compilerCtx.fs.writeFile(jsPath, code, { outputTargetType })];
      if (!!sourceMap) {
        writes.push(compilerCtx.fs.writeFile(mapPath, JSON.stringify(sourceMap), { outputTargetType }));
      }
      return Promise.all(writes);
    }),
  );

  return {
    bundleId,
    fileName,
    code,
  };
};
