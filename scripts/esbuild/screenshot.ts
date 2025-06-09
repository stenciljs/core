import type { BuildOptions as ESBuildOptions } from 'esbuild';
import fs from 'fs-extra';
import { join } from 'path';

import { getBanner } from '../utils/banner';
import { BuildOptions } from '../utils/options';
import { writePkgJson } from '../utils/write-pkg-json';
import { externalNodeModules, getBaseEsbuildOptions, getEsbuildAliases, runBuilds } from './utils';

const screenshotBuilds = {
  'Stencil Screenshot': 'index',
  'Stencil Screenshot Pixel Match': 'pixel-match',
};

export async function buildScreenshot(opts: BuildOptions) {
  const inputScreenshotDir = join(opts.buildDir, 'screenshot');
  const inputScreenshotSrcDir = join(opts.srcDir, 'screenshot');

  // copy @stencil/core/screenshot/index.d.ts
  await fs.copy(inputScreenshotDir, opts.output.screenshotDir, {
    filter: (f) => {
      if (f.endsWith('.d.ts')) {
        return true;
      }
      try {
        return fs.statSync(f).isDirectory();
      } catch (e) {}
      return false;
    },
  });

  // write @stencil/core/screenshot/package.json
  writePkgJson(opts, opts.output.screenshotDir, {
    description: 'Stencil Screenshot.',
    files: ['compare/', 'index.js', 'connector.js', 'local-connector.js', 'pixel-match.js'],
    main: 'index.js',
    name: '@stencil/core/screenshot',
    types: 'index.d.ts',
  });

  const aliases = getEsbuildAliases();
  const external = externalNodeModules;
  const baseScreenshotOptions = {
    ...getBaseEsbuildOptions(),
    alias: aliases,
    external,
    format: 'cjs',
    platform: 'node',
  } satisfies ESBuildOptions;

  return runBuilds(
    Object.entries(screenshotBuilds).map(
      ([label, file]) =>
        ({
          ...baseScreenshotOptions,
          banner: {
            js: getBanner(opts, label),
          },
          entryPoints: [join(inputScreenshotSrcDir, `${file}.ts`)],
          outfile: join(opts.output.screenshotDir, `${file}.js`),
        }) satisfies ESBuildOptions,
    ),
    opts,
  );
}
