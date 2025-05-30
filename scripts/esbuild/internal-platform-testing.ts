import type { BuildOptions as ESBuildOptions } from 'esbuild';
import fs from 'fs-extra';
import { join } from 'path';

import { BuildOptions } from '../utils/options';
import { writePkgJson } from '../utils/write-pkg-json';
import { externalAlias, externalNodeModules, getBaseEsbuildOptions, getEsbuildAliases } from './utils';

/**
 * Get an ESBuild configuration object for the internal testing bundle. This
 * function also has side-effects which set things up for the bundle to be built
 * correctly, like writing a `package.json` file to disk.
 *
 * @param opts build options
 * @returns a promise wrapping an object holding options for ESBuild
 */
export async function getInternalTestingBundle(opts: BuildOptions): Promise<ESBuildOptions> {
  const inputTestingPlatform = join(opts.srcDir, 'testing', 'platform', 'index.ts');
  const outputTestingPlatformDir = join(opts.output.internalDir, 'testing');

  await fs.emptyDir(outputTestingPlatformDir);

  // write @stencil/core/internal/testing/package.json
  writePkgJson(opts, outputTestingPlatformDir, {
    name: '@stencil/core/internal/testing',
    description:
      'Stencil internal testing platform to be imported by the Stencil Compiler. Breaking changes can and will happen at any time.',
    main: 'index.js',
  });

  const internalTestingAliases = {
    ...getEsbuildAliases(),
    '@platform': inputTestingPlatform,
    '@stencil/core/mock-doc': '../../mock-doc/index.cjs',
  };

  const external: string[] = [...externalNodeModules, '../../mock-doc/index.cjs'];

  const internalTestingBuildOptions: ESBuildOptions = {
    ...getBaseEsbuildOptions(),
    entryPoints: [inputTestingPlatform],
    bundle: true,
    format: 'cjs',
    outfile: join(outputTestingPlatformDir, 'index.js'),
    platform: 'node',
    logLevel: 'info',
    external,
    alias: internalTestingAliases,
    plugins: [
      externalAlias('@app-data', '@stencil/core/internal/app-data'),
      externalAlias('@utils/shadow-css', '../client/shadow-css.js'),
    ],
  };
  return internalTestingBuildOptions;
}
