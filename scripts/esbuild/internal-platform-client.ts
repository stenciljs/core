import type { BuildOptions as ESBuildOptions, Plugin } from 'esbuild';
import { replace } from 'esbuild-plugin-replace';
import fs from 'fs-extra';
import { glob } from 'glob';
import { join } from 'path';

import { getBanner } from '../utils/banner';
import { BuildOptions, createReplaceData } from '../utils/options';
import { writePkgJson } from '../utils/write-pkg-json';
import { externalAlias, externalNodeModules, getBaseEsbuildOptions, getEsbuildAliases } from './utils';

/**
 * Create objects containing ESbuild options for the two bundles which need to
 * be written to `internal/client`. This also performs relevant side-effects,
 * like clearing out the directory and writing a `package.json` script to disk.
 *
 * @param opts build options
 * @returns an array of ESBuild option objects
 */
export async function getInternalClientBundles(opts: BuildOptions): Promise<ESBuildOptions[]> {
  const inputClientDir = join(opts.srcDir, 'client');
  const outputInternalClientDir = join(opts.output.internalDir, 'client');
  const outputInternalClientPolyfillsDir = join(outputInternalClientDir, 'polyfills');

  await fs.emptyDir(outputInternalClientDir);
  await fs.emptyDir(outputInternalClientPolyfillsDir);

  await copyPolyfills(opts, outputInternalClientPolyfillsDir);

  // write @stencil/core/internal/client/package.json
  writePkgJson(opts, outputInternalClientDir, {
    name: '@stencil/core/internal/client',
    description:
      'Stencil internal client platform to be imported by the Stencil Compiler and internal runtime. Breaking changes can and will happen at any time.',
    exports: './index.js',
    main: './index.js',
    type: 'module',
    sideEffects: false,
  });

  const internalClientAliases = getEsbuildAliases();
  internalClientAliases['@platform'] = join(inputClientDir, 'index.ts');

  const clientExternal = externalNodeModules;

  const internalClientBundle: ESBuildOptions = {
    ...getBaseEsbuildOptions(),
    entryPoints: [join(inputClientDir, 'index.ts')],
    format: 'esm',
    // we do 'write: false' here because we write the build to disk in our
    // `findAndReplaceLoadModule` plugin below
    write: false,
    outfile: join(outputInternalClientDir, 'index.js'),
    platform: 'node',
    external: clientExternal,
    alias: internalClientAliases,
    banner: {
      js: getBanner(opts, 'Stencil Client Platform'),
    },
    plugins: [
      replace(createReplaceData(opts)),
      externalAlias('@app-data', '../app-data/index.js'),
      externalAlias('@app-globals', '../app-globals/index.js'),
      externalAlias('@utils/shadow-css', './shadow-css.js'),
      findAndReplaceLoadModule(),
    ],
  };

  const patchBrowserAliases = getEsbuildAliases();

  const polyfills = await fs.readdir(join(opts.srcDir, 'client', 'polyfills'));
  for (const polyFillFile of polyfills) {
    patchBrowserAliases[`polyfills/${polyFillFile}`] = join(opts.srcDir, 'client', 'polyfills');
  }

  const patchBrowserExternal = [...externalNodeModules, '@stencil/core', '@stencil/core/mock-doc'];

  const internalClientPatchBrowserBundle: ESBuildOptions = {
    ...getBaseEsbuildOptions(),
    entryPoints: [join(inputClientDir, 'client-patch-browser.ts')],
    format: 'esm',
    outfile: join(outputInternalClientDir, 'patch-browser.js'),
    platform: 'node',
    external: patchBrowserExternal,
    alias: patchBrowserAliases,
    banner: {
      js: getBanner(opts, 'Stencil Client Patch Browser'),
    },
    plugins: [
      replace(createReplaceData(opts)),
      externalAlias('@platform', '@stencil/core'),
      externalAlias('@app-data', '../app-data/index.js'),
      externalAlias('@app-globals', '../app-globals/index.js'),
    ],
  };

  return [internalClientBundle, internalClientPatchBrowserBundle];
}

/**
 * We need to manually find-and-replace a bit of code in
 * `client-load-module.ts` in order to prevent Esbuild from analyzing /
 * transforming the input by ensuring it does not start with `"./"`. However
 * some _other_ bundlers will _not_ work with such an import if it _lacks_ a
 * leading `"./"`, so we thus we have to do a little dance where we manually
 * replace it here after it's been run through Esbuild.
 *
 * @returns an Esbuild plugin
 */
export function findAndReplaceLoadModule(): Plugin {
  return {
    name: 'findAndReplaceLoadModule',
    setup(build) {
      build.onEnd(async (result) => {
        for (const file of result.outputFiles!) {
          const { path, text } = file;

          await fs.writeFile(path, text.replace(/\${MODULE_IMPORT_PREFIX}/, './'));
        }
      });
    },
  };
}

async function copyPolyfills(opts: BuildOptions, outputInternalClientPolyfillsDir: string) {
  const srcPolyfillsDir = join(opts.srcDir, 'client', 'polyfills');

  const srcPolyfillFiles = glob.sync('*.js', { cwd: srcPolyfillsDir });

  await Promise.all(
    srcPolyfillFiles.map(async (fileName) => {
      const src = join(srcPolyfillsDir, fileName);
      const dest = join(outputInternalClientPolyfillsDir, fileName);
      await fs.copyFile(src, dest);
    }),
  );
}
