import type { BuildOptions as ESBuildOptions } from 'esbuild';
import fs from 'fs-extra';
import { join } from 'path';

import { BuildOptions } from '../utils/options';
import { writePkgJson } from '../utils/write-pkg-json';
import { getBaseEsbuildOptions } from './utils';

/**
 * Get an object containing ESbuild options to build the internal app data
 * file. This function also performs relevant side-effects, like writing a
 * `package.json` file to disk.
 *
 * @param opts build options
 * @returns a Promise wrapping an array of ESbuild option objects
 */
export async function getInternalAppDataBundles(opts: BuildOptions): Promise<ESBuildOptions[]> {
  const appDataBuildDir = join(opts.buildDir, 'app-data');
  const appDataSrcDir = join(opts.srcDir, 'app-data');
  const outputInternalAppDataDir = join(opts.output.internalDir, 'app-data');

  await fs.emptyDir(outputInternalAppDataDir);

  // copy @stencil/core/internal/app-data/index.d.ts
  await fs.copyFile(join(appDataBuildDir, 'index.d.ts'), join(outputInternalAppDataDir, 'index.d.ts'));

  // write @stencil/core/internal/app-data/package.json
  writePkgJson(opts, outputInternalAppDataDir, {
    name: '@stencil/core/internal/app-data',
    description: 'Used for default app data and build conditionals within builds.',
    main: 'index.cjs',
    module: 'index.js',
    types: 'index.d.ts',
    sideEffects: false,
  });

  const appDataBaseOptions: ESBuildOptions = {
    ...getBaseEsbuildOptions(),
    entryPoints: [join(appDataSrcDir, 'index.ts')],
    platform: 'node',
  };

  const appDataESM: ESBuildOptions = {
    ...appDataBaseOptions,
    format: 'esm',
    outfile: join(outputInternalAppDataDir, 'index.js'),
  };

  const appDataCJS: ESBuildOptions = {
    ...appDataBaseOptions,
    format: 'cjs',
    outfile: join(outputInternalAppDataDir, 'index.cjs'),
  };

  return [appDataESM, appDataCJS];
}
