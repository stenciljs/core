import type { BuildOptions as ESBuildOptions } from 'esbuild';
import fs from 'fs-extra';
import path from 'path';
import resolve from 'resolve';
import webpack, { Configuration } from 'webpack';

import { getBanner } from '../utils/banner';
import type { BuildOptions } from '../utils/options';
import { writePkgJson } from '../utils/write-pkg-json';
import { externalAlias, externalNodeModules, getBaseEsbuildOptions, getEsbuildAliases, runBuilds } from './utils';

export async function buildSysNode(opts: BuildOptions) {
  const inputDir = path.join(opts.buildDir, 'sys', 'node');
  const srcDir = path.join(opts.srcDir, 'sys', 'node');
  const inputFile = path.join(srcDir, 'index.ts');
  const outputFile = path.join(opts.output.sysNodeDir, 'index.js');

  // clear out rollup stuff and ensure directory exists
  await fs.emptyDir(opts.output.sysNodeDir);

  // create public d.ts
  let dts = await fs.readFile(path.join(inputDir, 'public.d.ts'), 'utf8');
  dts = dts.replace('@stencil/core/internal', '../../internal/index');
  await fs.writeFile(path.join(opts.output.sysNodeDir, 'index.d.ts'), dts);

  // write @stencil/core/sys/node/package.json
  writePkgJson(opts, opts.output.sysNodeDir, {
    name: '@stencil/core/sys/node',
    description: 'Stencil Node System.',
    main: 'index.js',
    types: 'index.d.ts',
  });

  const external = [
    ...externalNodeModules,
    // normally you wouldn't externalize your "own" directory here, but since
    // we build multiple things within `opts.output.sysNodeDir` which should
    // externalize each other we need to do so
    '../../compiler/stencil.js',
    '../../sys/node/index.js',
    './glob.js',
  ];

  const sysNodeAliases = {
    ...getEsbuildAliases(),
    '@stencil/core/compiler': '../../compiler/stencil.js',
    '@sys-api-node': '../../sys/node/index.js',
  };

  const sysNodeOptions: ESBuildOptions = {
    ...getBaseEsbuildOptions(),
    entryPoints: [inputFile],
    bundle: true,
    format: 'cjs',
    outfile: outputFile,
    platform: 'node',
    logLevel: 'info',
    external,
    minify: true,
    alias: sysNodeAliases,
    banner: { js: getBanner(opts, `Stencil Node System`, true) },
    plugins: [externalAlias('graceful-fs', './graceful-fs.js')],
  };

  // sys/node/worker.js bundle
  const inputWorkerFile = path.join(srcDir, 'worker.ts');
  const outputWorkerFile = path.join(opts.output.sysNodeDir, 'worker.js');

  const workerOptions: ESBuildOptions = {
    ...getBaseEsbuildOptions(),
    entryPoints: [inputWorkerFile],
    bundle: true,
    format: 'cjs',
    outfile: outputWorkerFile,
    platform: 'node',
    logLevel: 'info',
    external,
    minify: true,
    alias: sysNodeAliases,
    banner: { js: getBanner(opts, `Stencil Node System Worker`, true) },
  };

  await sysNodeExternalBundles(opts);

  return runBuilds([sysNodeOptions, workerOptions], opts);
}

export const sysNodeBundleCacheDir = 'sys-node-bundle-cache';
async function sysNodeExternalBundles(opts: BuildOptions) {
  const cachedDir = path.join(opts.scriptsBuildDir, sysNodeBundleCacheDir);

  await fs.ensureDir(cachedDir);
  await Promise.all([
    bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'autoprefixer.js'),
    bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'glob.js'),
    bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'graceful-fs.js'),
    bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'node-fetch.js'),
    bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'prompts.js')
  ]);

  /**
   * Some of globs dependencies are using imports with a `node:` prefix which
   * is not supported by Jest v26. This is a workaround to remove the `node:`.
   * TODO(STENCIL-1323): remove once we deprecated Jest v26 support
   */
  const globOutputPath = path.join(opts.output.sysNodeDir, 'glob.js');
  const glob = fs.readFileSync(globOutputPath, 'utf8');
  fs.writeFileSync(globOutputPath, glob.replace(/require\("node:/g, 'require("'));
}

export function bundleExternal(opts: BuildOptions, outputDir: string, cachedDir: string, entryFileName: string) {
  return new Promise<void>(async (resolveBundle, rejectBundle) => {
    const outputFile = path.join(outputDir, entryFileName);
    const cachedFile = path.join(cachedDir, entryFileName) + (opts.isProd ? '.min.js' : '');

    const cachedExists = fs.existsSync(cachedFile);
    if (cachedExists) {
      await fs.copyFile(cachedFile, outputFile);
      resolveBundle();
      return;
    }

    const whitelist = new Set(['child_process', 'os', 'typescript']);
    const webpackConfig: Configuration = {
      entry: path.join(opts.srcDir, 'sys', 'node', 'bundles', entryFileName),
      output: {
        path: outputDir,
        filename: entryFileName,
        libraryTarget: 'commonjs',
      },
      target: 'node',
      node: {
        __dirname: false,
        __filename: false,
      },
      externals(data, callback) {
        const { request } = data;

        if (request?.match(/^(\.{0,2})\//)) {
          // absolute and relative paths are not externals
          return callback(null, undefined);
        }

        if (request === '@stencil/core/mock-doc') {
          return callback(null, '../../mock-doc');
        }

        if (typeof request === 'string' && whitelist.has(request)) {
          // we specifically do not want to bundle these imports
          resolve.sync(request);
          return callback(null, request);
        }

        // bundle this import
        callback(undefined, undefined);
      },
      resolve: {
        alias: {
          '@utils': path.join(opts.buildDir, 'utils', 'index.js'),
          postcss: path.join(opts.nodeModulesDir, 'postcss'),
          'source-map': path.join(opts.nodeModulesDir, 'source-map'),
          chalk: path.join(opts.bundleHelpersDir, 'empty.js'),
        },
      },
      optimization: {
        minimize: false,
      },
      mode: 'production',
    };

    console.log(`[sys-node] bundleExternal ${entryFileName} via webpack`)
    webpack(webpackConfig, async (err, stats) => {
      try {
        console.log(`[sys-node] bundleExternal ${entryFileName} success, err: ${err}, stats: ${stats}`)
        const { minify } = await import('terser');
        if (err && err.message) {
          rejectBundle(err);
        } else if (stats) {
          const info = stats.toJson({ errors: true });
          if (stats.hasErrors() && info && info.errors) {
            const webpackError = info.errors.join('\n');
            rejectBundle(webpackError);
          } else {
            let code = await fs.readFile(outputFile, 'utf8');

            if (opts.isProd) {
              try {
                const minifyResults = await minify(code);
                if (minifyResults.code) {
                  code = minifyResults.code;
                }
              } catch (e) {
                rejectBundle(e);
                return;
              }
            }
            await fs.writeFile(cachedFile, code);
            await fs.writeFile(outputFile, code);

            resolveBundle();
          }
        }
      } catch (e) {
        rejectBundle(e);
      }
    });
  });
}
