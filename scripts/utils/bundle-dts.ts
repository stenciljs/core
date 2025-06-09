import { EntryPointConfig, generateDtsBundle, OutputOptions } from 'dts-bundle-generator';
import fs from 'fs-extra';

import { BuildOptions } from './options';

/**
 * A thin wrapper for `dts-bundle-generator` which uses our build options to
 * set a few things up
 *
 * **Note**: this file caches its output to disk, and will return any
 * previously cached file if not in a prod environment!
 *
 * @param opts an object holding information about the current build of Stencil
 * @param inputFile the path to the file which should be bundled
 * @param outputOptions options for bundling the file
 * @param useCache whether or not the bundled file should be cached to disk
 * @returns a string containing the bundled typedef
 */
export async function bundleDts(
  opts: BuildOptions,
  inputFile: string,
  outputOptions?: OutputOptions,
  useCache = true,
): Promise<string> {
  const cachedDtsOutput = inputFile + '-bundled.d.ts';

  if (!opts.isProd && useCache) {
    try {
      return await fs.readFile(cachedDtsOutput, 'utf8');
    } catch (e) {}
  }

  const config: EntryPointConfig = {
    filePath: inputFile,
  };

  if (outputOptions) {
    config.output = outputOptions;
  }

  const outputCode = cleanDts(generateDtsBundle([config]).join('\n'));

  if (useCache) {
    await fs.writeFile(cachedDtsOutput, outputCode);
  }

  return outputCode;
}

export function cleanDts(dtsContent: string) {
  dtsContent = dtsContent.replace(/\/\/\/ <reference types="node" \/>/g, '');

  dtsContent = dtsContent.replace(/NodeJS.Process/g, 'any');

  dtsContent = dtsContent.replace(/import \{ URL \} from \'url\';/g, '');

  return dtsContent.trim() + '\n';
}
