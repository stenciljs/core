import type { BuildOptions as ESBuildOptions } from 'esbuild';
import fs from 'fs-extra';
import { join } from 'path';

import { getBanner } from '../utils/banner';
import { BuildOptions } from '../utils/options';
import { writePkgJson } from '../utils/write-pkg-json';
import { externalNodeModules, getBaseEsbuildOptions, getEsbuildAliases, runBuilds } from './utils';

/**
 * Runs esbuild to bundle the `cli` submodule
 *
 * @param opts build options
 * @returns a promise for this bundle's build output
 */
export async function buildCli(opts: BuildOptions) {
  // clear out rollup stuff
  await fs.emptyDir(opts.output.cliDir);

  const inputDir = join(opts.srcDir, 'cli');
  const buildDir = join(opts.buildDir, 'cli');

  const outputDir = opts.output.cliDir;
  const esmFilename = 'index.js';
  const cjsFilename = 'index.cjs';

  const dtsFilename = 'index.d.ts';

  const cliAliases = getEsbuildAliases();
  // this isn't strictly necessary to alias - however, this minimizes cuts down the bundle size by ~70kb.
  cliAliases['prompts'] = 'prompts/lib/index.js';

  const external = [...externalNodeModules, '../testing/*'];

  const cliEsbuildOptions = {
    ...getBaseEsbuildOptions(),
    alias: cliAliases,
    entryPoints: [join(inputDir, 'index.ts')],
    external,
    platform: 'node',
  } satisfies ESBuildOptions;

  // ESM build options
  const esmOptions: ESBuildOptions = {
    ...cliEsbuildOptions,
    outfile: join(outputDir, esmFilename),
    format: 'esm',
    banner: {
      js: getBanner(opts, `Stencil CLI`, true),
    },
  };

  // CommonJS build options
  const cjsOptions: ESBuildOptions = {
    ...cliEsbuildOptions,
    outfile: join(outputDir, cjsFilename),
    platform: 'node',
    format: 'cjs',
    banner: {
      js: getBanner(opts, `Stencil CLI (CommonJS)`, true),
    },
  };

  // create public d.ts
  let dts = await fs.readFile(join(buildDir, 'public.d.ts'), 'utf8');
  dts = dts.replace('@stencil/core/internal', '../internal/index');
  await fs.writeFile(join(opts.output.cliDir, dtsFilename), dts);

  // copy config-flags.d.ts
  let configDts = await fs.readFile(join(buildDir, 'config-flags.d.ts'), 'utf8');
  configDts = configDts.replace('@stencil/core/declarations', '../internal/index');
  await fs.writeFile(join(opts.output.cliDir, 'config-flags.d.ts'), configDts);

  // write cli/package.json
  writePkgJson(opts, opts.output.cliDir, {
    name: '@stencil/core/cli',
    description: 'Stencil CLI.',
    main: cjsFilename,
    module: esmFilename,
    types: dtsFilename,
  });

  return runBuilds([esmOptions, cjsOptions], opts);
}
