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
      chunkFileNames: esmOutputs[0].hashFileNames ? 'p-[hash].js' : '[name]-[hash].js',
      assetFileNames: esmOutputs[0].hashFileNames ? 'p-[hash][extname]' : '[name]-[hash][extname]',
      sourcemap: config.sourceMap,
      plugins: [
        lazyBundleIdPlugin(
          buildCtx,
          config,
          esmOutputs[0].hashFileNames ?? true,
          esmOutputs[0].hashedFileNameLength ?? 8,
          '',
          true,
        ),
      ],
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

      // Write backwards-compatible forwarding modules for CDN consumers who may
      // have hardcoded references to NAMESPACE.esm.js or index.esm.js - both were
      // real entry file names before the browser build dropped the .esm.js suffix
      await writeEsmForwardingModules(config, compilerCtx, outputTargetType, es2017destinations);
    }
  }

  return { name: 'esm-browser', buildCtx };
};

/**
 * Write backwards-compatible forwarding modules that re-export from the new .js files.
 * This allows existing CDN consumers with hardcoded .esm.js references to continue working.
 *
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param outputTargetType the output target type for file writing
 * @param destinations the destination directories to write forwarding modules to
 */
const writeEsmForwardingModules = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  outputTargetType: string,
  destinations: string[],
): Promise<void> => {
  // the namespace entry (e.g. NAMESPACE.js) and the user's index.ts entry (index.js)
  // are the only top-level browser entries that used to carry the .esm.js suffix
  const entryNames = [config.fsNamespace, 'index'];

  await Promise.all(
    destinations.flatMap((dest) =>
      entryNames.map((name) => {
        // Import ensures IIFE side effects run, export * re-exports named exports
        const forwardingCode = `import './${name}.js';\nexport * from './${name}.js';\n`;
        const filePath = join(dest, `${name}.esm.js`);
        return compilerCtx.fs.writeFile(filePath, forwardingCode, { outputTargetType });
      }),
    ),
  );
};
