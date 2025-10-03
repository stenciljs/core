import type { BuildOptions as ESBuildOptions } from 'esbuild';
import fs from 'fs-extra';
import { join } from 'path';

import { BuildOptions } from '../utils/options';
import { writePkgJson } from '../utils/write-pkg-json';
import { getBaseEsbuildOptions } from './utils';

/**
 * Get an object containing ESbuild options to build the internal app globals
 * file. This function also performs relevant side-effects, like writing a
 * `package.json` file to disk.
 *
 * @param opts build options
 * @returns a Promise wrapping an array of ESbuild option objects
 */
export async function getInternalAppGlobalsBundles(opts: BuildOptions): Promise<ESBuildOptions[]> {
  const appGlobalsBuildDir = join(opts.buildDir, 'app-globals');
  const appGlobalsSrcDir = join(opts.srcDir, 'app-globals');
  const outputInternalAppDataDir = join(opts.output.internalDir, 'app-globals');

  await fs.emptyDir(outputInternalAppDataDir);

  // copy @stencil/core/internal/app-globals/index.d.ts
  await fs.copyFile(join(appGlobalsBuildDir, 'index.d.ts'), join(outputInternalAppDataDir, 'index.d.ts'));

  // write @stencil/core/internal/app-globals/package.json
  writePkgJson(opts, outputInternalAppDataDir, {
    name: '@stencil/core/internal/app-globals',
    description: 'Used for default app globals.',
    main: 'index.js',
    module: 'index.js',
    sideEffects: false,
  });

  const appGlobalsBaseOptions: ESBuildOptions = {
    ...getBaseEsbuildOptions(),
    entryPoints: [join(appGlobalsSrcDir, 'index.ts')],
    platform: 'node',
  };

  const appGlobalsESM: ESBuildOptions = {
    ...appGlobalsBaseOptions,
    format: 'esm',
    outfile: join(outputInternalAppDataDir, 'index.js'),
  };

  return [appGlobalsESM];
}
