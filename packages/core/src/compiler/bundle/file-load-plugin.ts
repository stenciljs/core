import type { Plugin } from 'rollup';

import { isDtsFile, normalizeFsPath } from '../../utils';
import { InMemoryFileSystem } from '../sys/in-memory-fs';

export const fileLoadPlugin = (fs: InMemoryFileSystem): Plugin => {
  return {
    name: 'fileLoadPlugin',

    load(id) {
      const fsFilePath = normalizeFsPath(id);
      if (isDtsFile(fsFilePath)) {
        return '';
      }
      return fs.readFile(fsFilePath);
    },
  };
};
