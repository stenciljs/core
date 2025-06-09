import fs from 'fs-extra';
import { join } from 'path';

import type { BuildOptions } from '../../utils/options';

/**
 * Bundles the TypeScript compiler in the Stencil output. This function also performs several optimizations and
 * modifications to the TypeScript source.
 * @param tsPath a path to the TypeScript compiler
 * @param opts the options being used during a build of the Stencil compiler
 * @returns the modified TypeScript source
 */
export async function bundleTypeScriptSource(tsPath: string, opts: BuildOptions): Promise<string> {
  const cacheFile = tsCacheFilePath(opts);

  try {
    // check if we've already cached this bundle
    return await fs.readFile(cacheFile, 'utf8');
  } catch (e) {}

  // get the source typescript.js file to modify
  let code = await fs.readFile(tsPath, 'utf8');

  // As of 5.0, because typescript is now bundled with esbuild the structure of
  // the file we're dealing with here (`lib/typescript.js`) has changed.
  // Previously there was an iife which got an object as an argument and just
  // stuck properties onto it, something like
  //
  // ```js
  // var ts = (function (ts) {
  //   ts.someMethod = () => { ... };
  // })(ts || ts = {});
  // ```
  //
  // as of 5.0 it instead looks (conceptually) something like:
  //
  // ```js
  // var ts = (function () {
  //   const ts = {}
  //   const define = (name, value) => {
  //     Object.defineProperty(ts, name, value, { enumerable: true })
  //   }
  //   define('someMethod', () => { ... })
  //   return ts;
  // })();
  // ```
  //
  // Note that the call to `Object.defineProperty` does not set `configurable` to `true`
  // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty#description)
  // which means that later calls to do something like
  //
  // ```ts
  // import ts from 'typescript';
  //
  // ts.someMethod = function myReplacementForSomeMethod () {
  //   ...
  // };
  // ```
  //
  // will fail because without `configurable: true` you can't re-assign
  // properties.
  //
  // All well and good, except for the fact that our patching of typescript to
  // use for instance the in-memory file system depends on us being able to
  // monkey-patch typescript in exactly this way. So in order to retain our
  // current approach to patching TypeScript we need to edit this file in order
  // to add `configurable: true` to the options passed to
  // `Object.defineProperty`:
  const TS_PROP_DEFINER = `__defProp(target, name, { get: all[name], enumerable: true });`;
  const TS_PROP_DEFINER_RECONFIGURABLE = `__defProp(target, name, { get: all[name], enumerable: true, configurable: true });`;

  code = code.replace(TS_PROP_DEFINER, TS_PROP_DEFINER_RECONFIGURABLE);

  const jestTypesciptFilename = join(opts.scriptsBuildDir, 'typescript-modified-for-jest.js');
  await fs.writeFile(jestTypesciptFilename, code);

  // TODO(STENCIL-839): investigate minification issue w/ typescript 5.0
  // const { minify } = await import('terser');

  // if (opts.isProd) {
  //   const minified = await minify(code, {
  //     ecma: 2018,
  //     // module: true,
  //     compress: {
  //       ecma: 2018,
  //       passes: 2,
  //     },
  //     format: {
  //       ecma: 2018,
  //       comments: false,
  //     },
  //   });
  //   code = minified.code;
  // }

  await fs.writeFile(cacheFile, code);

  return code;
}

/**
 * Get the file path to which the cached, modified version of TypeScript will
 * be written
 *
 * @param opts build options for the current Stencil build
 * @returns the path where the modified TypeScript source can be found
 */
export function tsCacheFilePath(opts: BuildOptions): string {
  const fileName = `typescript-${opts.typescriptVersion.replace(/\./g, '_')}-bundle-cache${
    opts.isProd ? '.min' : ''
  }.js`;
  const cacheFile = join(opts.scriptsBuildDir, fileName);
  return cacheFile;
}
