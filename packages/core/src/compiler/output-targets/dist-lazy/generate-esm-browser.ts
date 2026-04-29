import type * as d from '@stencil/core';
import type { OutputOptions, RolldownBuild } from 'rolldown';

import { generatePreamble, join } from '../../../utils';
import { generateRolldownOutput } from '../../app-core/bundle-app-core';
import { generateLazyModules } from './generate-lazy-module';
import { lazyBundleIdPlugin } from './lazy-bundleid-plugin';

export const generateEsmBrowser = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  rolldownBuild: RolldownBuild,
  outputTargets: d.OutputTargetDistLazy[],
): Promise<d.UpdatedLazyBuildCtx> => {
  const esmOutputs = outputTargets.filter((o) => !!o.esmDir && !!o.isBrowserBuild);
  if (esmOutputs.length) {
    const outputTargetType = esmOutputs[0].type;
    const esmOpts: OutputOptions = {
      banner: generatePreamble(config),
      format: 'es',
      entryFileNames: '[name].js',
      chunkFileNames: config.hashFileNames ? 'p-[hash].js' : '[name]-[hash].js',
      assetFileNames: config.hashFileNames ? 'p-[hash][extname]' : '[name]-[hash][extname]',
      sourcemap: config.sourceMap,
      plugins: [lazyBundleIdPlugin(buildCtx, config, config.hashFileNames, '', true)],
    };

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
      buildCtx.esmBrowserComponentBundle = await generateLazyModules(
        config,
        compilerCtx,
        buildCtx,
        outputTargetType,
        es2017destinations,
        output,
        'es2017',
        true,
      );

      // Write backwards-compatible forwarding module for CDN consumers
      // who may have hardcoded references to NAMESPACE.esm.js
      await writeEsmForwardingModule(config, compilerCtx, outputTargetType, es2017destinations);
    }
  }

  return { name: 'esm-browser', buildCtx };
};

/**
 * Write a backwards-compatible forwarding module that re-exports from the new .js file.
 * This allows existing CDN consumers with hardcoded .esm.js references to continue working.
 *
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param outputTargetType the output target type for file writing
 * @param destinations the destination directories to write forwarding modules to
 */
const writeEsmForwardingModule = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  outputTargetType: string,
  destinations: string[],
): Promise<void> => {
  const namespace = config.fsNamespace;
  // Import ensures IIFE side effects run, export * re-exports setNonce
  const forwardingCode = `import './${namespace}.js';\nexport * from './${namespace}.js';\n`;

  await Promise.all(
    destinations.map((dest) => {
      const filePath = join(dest, `${namespace}.esm.js`);
      return compilerCtx.fs.writeFile(filePath, forwardingCode, { outputTargetType });
    }),
  );
};
