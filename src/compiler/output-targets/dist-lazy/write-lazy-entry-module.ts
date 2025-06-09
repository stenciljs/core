import { getSourceMappingUrlForEndOfFile, join } from '@utils';

import type * as d from '../../../declarations';

export const writeLazyModule = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  outputTargetType: string,
  destinations: string[],
  entryModule: d.EntryModule,
  shouldHash: boolean,
  code: string,
  sourceMap: d.SourceMap,
  sufix: string,
): Promise<d.BundleModuleOutput> => {
  // code = replaceStylePlaceholders(entryModule.cmps, modeName, code);

  const bundleId = await getBundleId(config, entryModule.entryKey, shouldHash, code, sufix);
  const fileName = `${bundleId}.entry.js`;

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

const getBundleId = async (
  config: d.ValidatedConfig,
  entryKey: string,
  shouldHash: boolean,
  code: string,
  sufix: string,
): Promise<string> => {
  if (shouldHash) {
    const hash = await config.sys.generateContentHash(code, config.hashedFileNameLength);
    return `p-${hash}${sufix}`;
  }

  const components = entryKey.split('.');
  let bundleId = components[0];
  if (components.length > 2) {
    bundleId = `${bundleId}_${components.length - 1}`;
  }

  return bundleId + sufix;
};
