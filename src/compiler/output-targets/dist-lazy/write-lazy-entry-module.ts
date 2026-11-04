import { join } from '@utils';

import type * as d from '../../../declarations';

export const writeLazyModule = async (
  compilerCtx: d.CompilerCtx,
  outputTargetType: string,
  destination: string,
  code: string,
  sourceMap: d.SourceMap,
  rollupResult: d.RollupChunkResult
): Promise<d.BundleModuleOutput> => {
  const fileName = rollupResult.fileName;
  const bundleId = fileName.replace('.entry.js', '');

  const jsPath = join(destination, fileName);
  const mapPath = jsPath + '.map';
  const writes: Promise<any>[] = [compilerCtx.fs.writeFile(jsPath, code, { outputTargetType })];

  if (!!sourceMap) {
    writes.push(compilerCtx.fs.writeFile(mapPath, JSON.stringify(sourceMap), { outputTargetType }));
  }

  await Promise.all(writes);


  return {
    bundleId,
    fileName,
    code,
  };
};
