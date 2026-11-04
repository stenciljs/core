import { generatePreamble, join, relativeImport } from '@utils';
import type { OutputOptions, RollupBuild } from 'rollup';

import type * as d from '../../../declarations';
import type { RollupResult } from '../../../declarations';
import { generateRollupOutput } from '../../app-core/bundle-app-core';
import { generateLazyModules } from './generate-lazy-module';
import { lazyBundleIdPlugin } from './lazy-bundleid-plugin';

export const generateEsm = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  rollupBuild: RollupBuild,
  outputTargets: d.OutputTargetDistLazy[],
): Promise<d.UpdatedLazyBuildCtx[]> => {
  const esmEs5Outputs = config.buildEs5
    ? outputTargets.filter((o) => !!o.esmEs5Dir && !o.isBrowserBuild && typeof o.esmEs5Dir === 'string')
    : [];
  const esmOutputs = outputTargets.filter((o) => !!o.esmDir && !o.isBrowserBuild && typeof o.esmDir === 'string');

  return Promise.all([
    ...esmOutputs.map(async (esmOutput) => {
      const esmOpts: OutputOptions = {
        banner: generatePreamble(config),
        format: 'es',
        entryFileNames: '[name].entry.js',
        assetFileNames: '[name]-[hash][extname]',
        sourcemap: config.sourceMap,
        dir: esmOutput.esmDir,
        plugins: [lazyBundleIdPlugin(config)],
      };

      const output = await generateRollupOutput(rollupBuild, esmOpts, config, buildCtx.entryModules);

      if (output != null) {
        buildCtx.esmComponentBundle = await generateLazyModules(
          config,
          compilerCtx,
          buildCtx,
          esmOutput.type,
          esmOutput.esmDir,
          output,
          'es2017',
          false,
        );

        await generateShortcuts(config, compilerCtx, outputTargets, output);

        return { name: 'esm' as const, buildCtx };
      }

      return null;
    }),
    ...esmEs5Outputs.map(async (esmEs5Output) => {
      const esmOpts: OutputOptions = {
        banner: generatePreamble(config),
        format: 'es',
        entryFileNames: '[name].entry.js',
        assetFileNames: '[name]-[hash][extname]',
        sourcemap: config.sourceMap,
        dir: esmEs5Output.esmEs5Dir,
        plugins: [lazyBundleIdPlugin(config)],
      };

      const output = await generateRollupOutput(rollupBuild, esmOpts, config, buildCtx.entryModules);

      if (output != null) {
        buildCtx.es5ComponentBundle = await generateLazyModules(
          config,
          compilerCtx,
          buildCtx,
          esmEs5Output.type,
          esmEs5Output.esmEs5Dir,
          output,
          'es5',
          false,
        );

        if (config.buildEs5) {
          await copyPolyfills(config, compilerCtx, esmOutputs);
        }

        await generateShortcuts(config, compilerCtx, outputTargets, output);

        return { name: 'es5' as const, buildCtx };
      }

      return null;
    }),
  ]);
};

/**
 * Copy polyfills from `$INSTALL_DIR/internal/client/polyfills` to the lazy
 * loader output directory where $INSTALL_DIR is the directory in which the
 * `@stencil/core` package is installed.
 *
 * @param config a validated Stencil configuration
 * @param compilerCtx the current compiler context
 * @param outputTargets dist-lazy output targets
 */
const copyPolyfills = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  outputTargets: d.OutputTargetDistLazy[],
): Promise<void> => {
  const destinations = outputTargets
    .filter((o) => o.polyfills)
    .map((o) => o.esmDir)
    .filter((esmDir): esmDir is string => typeof esmDir === 'string');
  if (destinations.length === 0) {
    return;
  }

  const src = join(config.sys.getCompilerExecutingPath(), '..', '..', 'internal', 'client', 'polyfills');
  const files = await compilerCtx.fs.readdir(src);

  await Promise.all(
    destinations.map((dest) => {
      return Promise.all(
        files.map((f) => {
          return compilerCtx.fs.copyFile(f.absPath, join(dest, 'polyfills', f.relPath));
        }),
      );
    }),
  );
};

const generateShortcuts = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  outputTargets: d.OutputTargetDistLazy[],
  rollupResult: RollupResult[],
): Promise<void[]> => {
  const indexFilename = rollupResult.find((r) => r.type === 'chunk' && r.isIndex).fileName;

  return Promise.all(
    outputTargets.map(async (o) => {
      if (o.esmDir && o.esmIndexFile) {
        const entryPointPath =
          config.buildEs5 && o.esmEs5Dir ? join(o.esmEs5Dir, indexFilename) : join(o.esmDir, indexFilename);

        const relativePath = relativeImport(o.esmIndexFile, entryPointPath);
        const shortcutContent = `export * from '${relativePath}';`;
        await compilerCtx.fs.writeFile(o.esmIndexFile, shortcutContent, { outputTargetType: o.type });
      }
    }),
  );
};
