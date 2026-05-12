import type * as d from '@stencil/core';
import type { RolldownResult } from '@stencil/core';
import type { OutputOptions, RolldownBuild } from 'rolldown';

import { generatePreamble, join, relativeImport } from '../../../utils';
import { generateRolldownOutput } from '../../app-core/bundle-app-core';
import { generateLazyModules } from './generate-lazy-module';
import { lazyBundleIdPlugin } from './lazy-bundleid-plugin';

export const generateEsm = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  rolldownBuild: RolldownBuild,
  outputTargets: d.OutputTargetDistLazy[],
): Promise<d.UpdatedLazyBuildCtx> => {
  const esmOutputs = outputTargets.filter((o) => !!o.esmDir && !o.isBrowserBuild);
  if (esmOutputs.length > 0) {
    const esmOpts: OutputOptions = {
      banner: generatePreamble(config),
      format: 'es',
      entryFileNames: '[name].js',
      assetFileNames: '[name]-[hash][extname]',
      sourcemap: config.sourceMap,
      plugins: [lazyBundleIdPlugin(buildCtx, config, false, 8, '')],
    };
    const outputTargetType = esmOutputs[0].type;
    const output = await generateRolldownOutput(
      rolldownBuild,
      esmOpts,
      config,
      buildCtx.entryModules,
    );

    if (output != null) {
      const es2017destinations = esmOutputs
        .map((o) => o.esmDir)
        .filter((esmDir): esmDir is string => typeof esmDir === 'string');
      buildCtx.esmComponentBundle = await generateLazyModules(
        config,
        compilerCtx,
        buildCtx,
        outputTargetType,
        es2017destinations,
        output,
        'es2017',
        false,
      );

      await generateShortcuts(compilerCtx, outputTargets, output);
    }
  }

  return { name: 'esm', buildCtx };
};

const generateShortcuts = (
  compilerCtx: d.CompilerCtx,
  outputTargets: d.OutputTargetDistLazy[],
  rolldownResult: RolldownResult[],
): Promise<void[]> => {
  const indexFilename = rolldownResult.find((r) => r.type === 'chunk' && r.isIndex).fileName;

  return Promise.all(
    outputTargets.map(async (o) => {
      if (o.esmDir && o.esmIndexFile) {
        const entryPointPath = join(o.esmDir, indexFilename);
        const relativePath = relativeImport(o.esmIndexFile, entryPointPath);
        const shortcutContent = `export * from '${relativePath}';\n`;
        await compilerCtx.fs.writeFile(o.esmIndexFile, shortcutContent, {
          outputTargetType: o.type,
        });
      }
    }),
  );
};
