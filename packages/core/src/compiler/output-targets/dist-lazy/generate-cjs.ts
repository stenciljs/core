import type * as d from '@stencil/core';
import type { OutputOptions, RolldownBuild } from 'rolldown';

import { generatePreamble, join, relativeImport } from '../../../utils';
import { generateRollupOutput } from '../../app-core/bundle-app-core';
import { generateLazyModules } from './generate-lazy-module';
import { lazyBundleIdPlugin } from './lazy-bundleid-plugin';

export const generateCjs = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  rollupBuild: RolldownBuild,
  outputTargets: d.OutputTargetDistLazy[],
): Promise<d.UpdatedLazyBuildCtx> => {
  const cjsOutputs = outputTargets.filter((o) => !!o.cjsDir);

  if (cjsOutputs.length > 0) {
    const outputTargetType = cjsOutputs[0].type;
    const esmOpts: OutputOptions = {
      banner: generatePreamble(config),
      format: 'cjs',
      entryFileNames: '[name].cjs.js',
      assetFileNames: '[name]-[hash][extname]',
      sourcemap: config.sourceMap,
      plugins: [lazyBundleIdPlugin(buildCtx, config, false, '.cjs')],
    };

    // Note: interop and dynamicImportInCjs options are not supported in Rolldown
    if (!!config.extras.experimentalImportInjection || !!config.extras.enableImportInjection) {
      esmOpts.dynamicImportInCjs = false;
    }

    const results = await generateRollupOutput(rollupBuild, esmOpts, config, buildCtx.entryModules);
    if (results != null) {
      const destinations = cjsOutputs
        .map((o) => o.cjsDir)
        .filter((cjsDir): cjsDir is string => typeof cjsDir === 'string');

      buildCtx.commonJsComponentBundle = await generateLazyModules(
        config,
        compilerCtx,
        buildCtx,
        outputTargetType,
        destinations,
        results,
        'es2017',
        false,
      );

      await generateShortcuts(compilerCtx, results, cjsOutputs);
    }
  }

  return { name: 'cjs', buildCtx };
};

const generateShortcuts = (
  compilerCtx: d.CompilerCtx,
  rollupResult: d.RollupResult[],
  outputTargets: d.OutputTargetDistLazy[],
): Promise<void[]> => {
  const indexFilename = rollupResult.find((r) => r.type === 'chunk' && r.isIndex).fileName;
  return Promise.all(
    outputTargets.map(async (o) => {
      if (o.cjsIndexFile) {
        const entryPointPath = join(o.cjsDir, indexFilename);
        const relativePath = relativeImport(o.cjsIndexFile, entryPointPath);
        const shortcutContent = `module.exports = require('${relativePath}');\n`;
        await compilerCtx.fs.writeFile(o.cjsIndexFile, shortcutContent, {
          outputTargetType: o.type,
        });
      }
    }),
  );
};
