import type { BuildOptions as ESBuildOptions } from 'esbuild';
import fs from 'fs-extra';
import { join } from 'path';

import { getBanner } from '../utils/banner';
import { BuildOptions, createReplaceData } from '../utils/options';
import { writePkgJson } from '../utils/write-pkg-json';
import { getBaseEsbuildOptions, getEsbuildAliases, runBuilds } from './utils';
import { bundleParse5 } from './utils/parse5';

/**
 * Use esbuild to bundle the `mock-doc` submodule
 *
 * @param opts build options
 * @returns a promise for this bundle's build output
 */
export async function buildMockDoc(opts: BuildOptions) {
  const inputDir = join(opts.buildDir, 'mock-doc');
  const srcDir = join(opts.srcDir, 'mock-doc');
  const outputDir = opts.output.mockDocDir;

  // clear out rollup stuff and ensure directory exists
  await fs.emptyDir(outputDir);

  await bundleMockDocDts(inputDir, outputDir);

  writePkgJson(opts, outputDir, {
    name: '@stencil/core/mock-doc',
    description: 'Mock window, document and DOM outside of a browser environment.',
    main: 'index.cjs',
    module: 'index.js',
    types: 'index.d.ts',
    sideEffects: false,
  });

  // we need to call `createReplaceData` here not because we plan to use the
  // replace data in this bundle but because the function has some side-effects
  // that we need here. in particular, it sets the version of `parse5` on
  // `opts` and the `bundleParse5` function has an implicit dependency on this
  // value being already set.
  createReplaceData(opts);

  const mockDocAliases = getEsbuildAliases();

  const [, parse5Path] = await bundleParse5(opts);
  mockDocAliases['parse5'] = parse5Path;

  const mockDocBuildOptions: ESBuildOptions = {
    ...getBaseEsbuildOptions(),
    entryPoints: [join(srcDir, 'index.ts')],
    bundle: true,
    alias: mockDocAliases,
    logLevel: 'info',
  };

  const esmOptions: ESBuildOptions = {
    ...mockDocBuildOptions,
    format: 'esm',
    outfile: join(outputDir, 'index.js'),
    banner: { js: getBanner(opts, `Stencil Mock Doc`, true) },
  };

  const cjsOptions: ESBuildOptions = {
    ...mockDocBuildOptions,
    format: 'cjs',
    outfile: join(outputDir, 'index.cjs'),
    banner: { js: getBanner(opts, `Stencil Mock Doc (CommonJS)`, true) },
  };

  return runBuilds([esmOptions, cjsOptions], opts);
}

async function bundleMockDocDts(inputDir: string, outputDir: string) {
  // only reason we can do this is because we already know the shape
  // of mock-doc's dts files and how we want them to come together
  const srcDtsFiles = (await fs.readdir(inputDir)).filter((f) => {
    return f.endsWith('.d.ts') && !f.endsWith('index.d.ts') && !f.endsWith('index.d.ts-bundled.d.ts');
  });

  const output = await Promise.all(
    srcDtsFiles.map((inputDtsFile) => {
      return getDtsContent(inputDir, inputDtsFile);
    }),
  );

  const srcIndexDts = await fs.readFile(join(inputDir, 'index.d.ts'), 'utf8');
  output.push(getMockDocExports(srcIndexDts));

  await fs.writeFile(join(outputDir, 'index.d.ts'), output.join('\n') + '\n');
}

async function getDtsContent(inputDir: string, inputDtsFile: string) {
  const srcDtsText = await fs.readFile(join(inputDir, inputDtsFile), 'utf8');
  const allLines = srcDtsText.split('\n');

  const filteredLines = allLines.filter((ln) => {
    if (ln.trim().startsWith('///')) {
      return false;
    }
    if (ln.trim().startsWith('import ')) {
      return false;
    }
    if (ln.trim().startsWith('__')) {
      return false;
    }
    if (ln.trim().startsWith('private')) {
      return false;
    }
    if (ln.replace(/ /g, '').startsWith('export{}')) {
      return false;
    }
    return true;
  });

  let dtsContent = filteredLines
    .map((ln) => {
      if (ln.trim().startsWith('export ')) {
        ln = ln.replace('export ', '');
      }
      return ln;
    })
    .join('\n')
    .trim();

  dtsContent = dtsContent.replace(/    /g, '  ');

  return dtsContent;
}

function getMockDocExports(srcIndexDts: string) {
  const exportLines = srcIndexDts.split('\n').filter((ln) => ln.trim().startsWith('export {'));
  const dtsExports: string[] = [];

  exportLines.forEach((ln) => {
    const splt = ln.split('{')[1].split('}')[0].trim();
    const exportNames = splt
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    dtsExports.push(...exportNames);
  });

  return `export { ${dtsExports.sort().join(', ')} }`;
}
