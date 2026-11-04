import { generatePreamble } from '@utils';
import type { OutputOptions, RollupBuild } from 'rollup';

import type * as d from '../../../declarations';
import { generateRollupOutput } from '../../app-core/bundle-app-core';
import { generateLazyModules } from './generate-lazy-module';
import { lazyBundleIdPlugin } from './lazy-bundleid-plugin';

export const generateEsmBrowser = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  rollupBuild: RollupBuild,
  outputTargets: d.OutputTargetDistLazy[],
): Promise<d.UpdatedLazyBuildCtx[]> => {
  const esmOutputs = outputTargets.filter((o) => !!o.esmDir && !!o.isBrowserBuild && typeof o.esmDir === 'string');

  return Promise.all(
    esmOutputs.map(async (esmOutput) => {
      const esmOpts: OutputOptions = {
        banner: generatePreamble(config),
        format: 'es',
        entryFileNames: config.hashFileNames ? 'p-[hash].entry.js' : '[name].esm.entry.js',
        chunkFileNames: config.hashFileNames ? 'p-[hash].js' : '[name]-[hash].js',
        assetFileNames: config.hashFileNames ? 'p-[hash][extname]' : '[name]-[hash][extname]',
        sourcemap: config.sourceMap,
        dir: esmOutput.esmDir,
        plugins: [lazyBundleIdPlugin(config, true)],
      };

      const output = await generateRollupOutput(rollupBuild, esmOpts, config, buildCtx.entryModules);

      if (output != null) {
        buildCtx.esmBrowserComponentBundle = await generateLazyModules(
          config,
          compilerCtx,
          buildCtx,
          esmOutput.type,
          esmOutput.esmDir,
          output,
          'es2017',
          true,
        );

        return { name: 'esm-browser', buildCtx };
      }

      return null;
    }),
  );
};
