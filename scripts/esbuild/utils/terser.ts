import fs from 'fs-extra';
import { join } from 'path';
import { rollup } from 'rollup';

import type { BuildOptions } from '../../utils/options';

/**
 * Creates a bundle containing Terser
 * @param opts the options being used during a build
 * @returns a tuple containing the bundled Terser code and the path where it
 * was written
 */
export async function bundleTerser(opts: BuildOptions): Promise<[content: string, path: string]> {
  if (!opts.terserVersion) {
    throw new Error('Terser version not set on build opts!');
  }

  const fileName = `terser-${opts.terserVersion.replace(/\./g, '_')}-bundle-cache${opts.isProd ? '.min' : ''}.js`;
  const cacheFile = join(opts.scriptsBuildDir, fileName);

  try {
    const content = await fs.readFile(cacheFile, 'utf8');
    return [content, cacheFile];
  } catch (e) {}

  const rollupBuild = await rollup({
    input: join(opts.nodeModulesDir, 'terser', 'main.js'),
    external: ['source-map'],
  });

  const { output } = await rollupBuild.generate({
    format: 'es',
    strict: false,
  });

  let code = output[0].code;

  const { minify } = await import('terser');

  if (opts.isProd) {
    const minified = await minify(code, {
      ecma: 2018,
      compress: {
        ecma: 2018,
        passes: 2,
      },
      format: {
        ecma: 2018,
        comments: false,
      },
    });
    if (minified.code) {
      code = minified.code;
    }
  }

  code = `// Terser ${opts.terserVersion}\n` + code;

  await fs.writeFile(cacheFile, code);

  return [code, cacheFile];
}
