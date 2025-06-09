import type { BuildOptions as ESBuildOptions, Plugin } from 'esbuild';
import fs from 'fs-extra';
import path from 'path';

import { getBanner } from '../utils/banner';
import type { BuildOptions } from '../utils/options';
import { writePkgJson } from '../utils/write-pkg-json';
import {
  externalAlias,
  externalNodeModules,
  getBaseEsbuildOptions,
  getEsbuildAliases,
  getFirstOutputFile,
  runBuilds,
} from './utils';

const EXTERNAL_TESTING_MODULES = [
  'constants',
  'rollup',
  '@rollup/plugin-commonjs',
  '@rollup/plugin-node-resolve',
  'yargs',
  'zlib',
];

export async function buildTesting(opts: BuildOptions) {
  const inputDir = path.join(opts.buildDir, 'testing');
  const sourceDir = path.join(opts.srcDir, 'testing');
  await fs.emptyDir(opts.output.testingDir);

  await Promise.all([
    // copy jest testing entry files
    fs.copy(path.join(opts.scriptsBundlesDir, 'helpers', 'jest'), opts.output.testingDir),
    copyTestingInternalDts(opts, inputDir),
  ]);

  // write package.json
  writePkgJson(opts, opts.output.testingDir, {
    name: '@stencil/core/testing',
    description: 'Stencil testing suite.',
    main: 'index.js',
    types: 'index.d.ts',
  });

  const external = [
    ...EXTERNAL_TESTING_MODULES,
    ...externalNodeModules,
    '../internal/testing/*',
    '../cli/index.cjs',
    '../sys/node/index.js',
    '../compiler/stencil.js',
  ];

  const aliases = getEsbuildAliases();
  const testingEsbuildOptions: ESBuildOptions = {
    ...getBaseEsbuildOptions(),
    entryPoints: [path.join(sourceDir, 'index.ts')],
    bundle: true,
    format: 'cjs',
    outfile: path.join(opts.output.testingDir, 'index.js'),
    platform: 'node',
    logLevel: 'info',
    external,
    /**
     * set `write: false` so that we can run the `onEnd` hook
     * in `lazyRequirePlugin` and modify the imports
     */
    write: false,
    alias: aliases,
    banner: { js: getBanner(opts, `Stencil Testing`, true) },
    plugins: [
      externalAlias('@app-data', '@stencil/core/internal/app-data'),
      externalAlias('@platform', '@stencil/core/internal/testing'),
      externalAlias('../internal/testing/index.js', '@stencil/core/internal/testing'),
      externalAlias('@stencil/core/dev-server', '../dev-server/index.js'),
      externalAlias('@stencil/core/mock-doc', '../mock-doc/index.cjs'),
      lazyRequirePlugin(opts, [
        '@stencil/core/internal/app-data',
        '@stencil/core/internal/testing',
        '../dev-server/index.js',
        '../internal/testing/index.js',
        '../mock-doc/index.cjs',
      ]),
      ignorePuppeteerDependency(opts),
    ],
  };

  return runBuilds([testingEsbuildOptions], opts);
}

function getLazyRequireFn(opts: BuildOptions) {
  return fs.readFileSync(path.join(opts.bundleHelpersDir, 'lazy-require.js'), 'utf8').trim();
}

function lazyRequirePlugin(opts: BuildOptions, moduleIds: string[]): Plugin {
  return {
    name: 'lazyRequirePlugin',
    setup(build) {
      build.onEnd(async (buildResult) => {
        const bundle = getFirstOutputFile(buildResult);
        let code = Buffer.from(bundle.contents).toString();

        for (const moduleId of moduleIds) {
          const str = `require("${moduleId}")`;
          while (code.includes(str)) {
            code = code.replace(str, `_lazyRequire("${moduleId}")`);
          }
        }

        code = code.replace(`"use strict";`, `"use strict";\n\n${getLazyRequireFn(opts)}`);
        return fs.writeFile(bundle.path, code);
      });
    },
  };
}

/**
 * To avoid having user to install puppeteer for building their app (even if
 * they don't use e2e testing), we ignore the puppeteer dependency in the
 * generated d.ts file.
 *
 * @param opts build options
 * @returns an ESbuild plugin
 */
function ignorePuppeteerDependency(opts: BuildOptions): Plugin {
  return {
    name: 'ignorePuppeteerDependency',
    setup(build) {
      build.onEnd(async () => {
        await writePatchedPuppeteerDts(opts);
      });
    },
  };
}

export async function copyTestingInternalDts(opts: BuildOptions, inputDir: string) {
  // copy testing d.ts files

  await fs.copy(path.join(inputDir), path.join(opts.output.testingDir), {
    filter: (f) => {
      if (f.endsWith('.d.ts')) {
        return true;
      }
      if (fs.statSync(f).isDirectory() && !f.includes('platform')) {
        return true;
      }
      return false;
    },
  });
}

/**
 * Write a patched version of
 * `src/testing/puppeteer/puppeteer-declarations.d.ts` which has a `@ts-ignore`
 * added to prevent a type-checking error if a Stencil project does not have
 * puppeteer installed.
 *
 * @param opts build options
 */
export async function writePatchedPuppeteerDts(opts: BuildOptions) {
  const typeFilePath = path.join(opts.output.testingDir, 'puppeteer', 'puppeteer-declarations.d.ts');
  const updatedFileContent = (await fs.readFile(typeFilePath, 'utf8'))
    .split('\n')
    .reduce((lines, line) => {
      if (line.endsWith(`from 'puppeteer';`)) {
        lines.push('// @ts-ignore - avoid requiring puppeteer as dependency');
      }
      lines.push(line);
      return lines;
    }, [] as string[])
    .join('\n');
  await fs.writeFile(typeFilePath, updatedFileContent);
}
