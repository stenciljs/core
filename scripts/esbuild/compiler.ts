import type { BuildOptions as ESBuildOptions } from 'esbuild';
import { replace } from 'esbuild-plugin-replace';
import fs from 'fs-extra';
import { join } from 'path';

import { getBanner } from '../utils/banner';
import { BuildOptions, createReplaceData } from '../utils/options';
import { writePkgJson } from '../utils/write-pkg-json';
import { externalNodeModules, getBaseEsbuildOptions, getEsbuildAliases, runBuilds } from './utils';
import { bundleParse5 } from './utils/parse5';
import { bundleTerser } from './utils/terser';
import { bundleTypeScriptSource, tsCacheFilePath } from './utils/typescript-source';

export async function buildCompiler(opts: BuildOptions) {
  const inputDir = join(opts.buildDir, 'compiler');
  const srcDir = join(opts.srcDir, 'compiler');
  const compilerFileName = 'stencil.js';
  const compilerDtsName = compilerFileName.replace('.js', '.d.ts');

  // clear out rollup stuff and ensure directory exists
  await fs.emptyDir(opts.output.compilerDir);

  // create public d.ts
  let dts = await fs.readFile(join(inputDir, 'public.d.ts'), 'utf8');
  dts = dts.replace('@stencil/core/internal', '../internal/index');
  await fs.writeFile(join(opts.output.compilerDir, compilerDtsName), dts);

  // write @stencil/core/compiler/package.json
  writePkgJson(opts, opts.output.compilerDir, {
    name: '@stencil/core/compiler',
    description: 'Stencil Compiler.',
    main: compilerFileName,
    types: compilerDtsName,
  });

  // copy and edit compiler/sys/in-memory-fs.d.ts
  let inMemoryFsDts = await fs.readFile(join(inputDir, 'sys', 'in-memory-fs.d.ts'), 'utf8');
  inMemoryFsDts = inMemoryFsDts.replace('@stencil/core/internal', '../../internal/index');
  await fs.ensureDir(join(opts.output.compilerDir, 'sys'));
  await fs.writeFile(join(opts.output.compilerDir, 'sys', 'in-memory-fs.d.ts'), inMemoryFsDts);

  // copy and edit compiler/transpile.d.ts
  let transpileDts = await fs.readFile(join(inputDir, 'transpile.d.ts'), 'utf8');
  transpileDts = transpileDts.replace('@stencil/core/internal', '../internal/index');
  await fs.writeFile(join(opts.output.compilerDir, 'transpile.d.ts'), transpileDts);

  const alias: Record<string, string> = {
    ...getEsbuildAliases(),
    glob: './sys/node/glob.js',
    '@sys-api-node': '../sys/node/index.js',
  };

  const external = [
    ...externalNodeModules,
    '../mock-doc/index.cjs',
    '../sys/node/autoprefixer.js',
    '../sys/node/index.js',
  ];

  // get replace data, which replaces certain strings within the output with
  // build-time constants.
  //
  // this setup was originally designed for use with the Rollup `replace`
  // plugin, but there is an esbuild plugin which provides equivalent
  // functionality
  //
  // note that the `bundleTypeScriptSource` function implicitly depends on
  // `createReplaceData` being called before it
  const replaceData = createReplaceData(opts);

  // stuff to patch typescript before bundling
  const tsPath = require.resolve('typescript');
  await bundleTypeScriptSource(tsPath, opts);
  const tsFilePath = tsCacheFilePath(opts);
  alias['typescript'] = tsFilePath;

  // same for terser
  const [, terserPath] = await bundleTerser(opts);
  alias['terser'] = terserPath;

  // and parse5
  const [, parse5path] = await bundleParse5(opts);
  alias['parse5'] = parse5path;

  const compilerEsbuildOptions: ESBuildOptions = {
    ...getBaseEsbuildOptions(),
    banner: { js: getBanner(opts, 'Stencil Compiler', true) },
    entryPoints: [join(srcDir, 'index.ts')],
    platform: 'node',
    external,
    format: 'cjs',
    alias,
    plugins: [replace(replaceData)],
    outfile: join(opts.output.compilerDir, compilerFileName),
  };

  // copy typescript default lib dts files
  const tsLibNames = await getTypeScriptDefaultLibNames(opts);
  await Promise.all(tsLibNames.map((f) => fs.copy(join(opts.typescriptLibDir, f), join(opts.output.compilerDir, f))));

  return runBuilds([compilerEsbuildOptions], opts);
}

/**
 * Helper function that reads in the `lib.*.d.ts` files in the TypeScript lib/ directory on disk.
 * @param opts the Stencil build options, which includes the location of the TypeScript lib/
 * @returns all file names that match the `lib.*.d.ts` format
 */
async function getTypeScriptDefaultLibNames(opts: BuildOptions): Promise<string[]> {
  return (await fs.readdir(opts.typescriptLibDir)).filter((f) => f.startsWith('lib.') && f.endsWith('.d.ts'));
}
