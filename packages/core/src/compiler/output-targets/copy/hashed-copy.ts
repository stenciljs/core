import { join } from '@utils';
import { dirname, extname } from 'path';

import type * as d from '../../../declarations';

/**
 * Create a copy of a given file in its current directory but with a filename
 * derived by hashing the file contents. This allows us to refer to a file by
 * name and ensure that a given filename always refers to the same file
 * contents.
 *
 * So for instance if you had a directory:
 *
 * ```
 * build
 * └── index.js
 * ```
 *
 * and the contents of `build/index.js` hashed to `1234abcd` then write a
 * file to `build/p-1234abcd.js` with the contents of `build/index.js`,
 * giving:
 *
 * ```
 * build
 * ├── index.js
 * └── p-1234abcd.js
 * ```
 *
 * Assuming that the contents of `build/index.js` did not change re-running
 * this function will produce the same output.
 *
 * @param config the current user-supplied config
 * @param compilerCtx a compiler context
 * @param path the path to read and hash from
 * @returns the newly-written path or undefined if not written
 */
export const generateHashedCopy = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  path: string,
): Promise<string | undefined> => {
  try {
    const content = await compilerCtx.fs.readFile(path);
    const hash = await config.sys.generateContentHash(content, config.hashedFileNameLength);
    const hashedFileName = `p-${hash}${extname(path)}`;
    await compilerCtx.fs.writeFile(join(dirname(path), hashedFileName), content);
    return hashedFileName;
  } catch (e) {}
  return undefined;
};
