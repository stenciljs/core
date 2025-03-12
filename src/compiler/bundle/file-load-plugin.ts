import { normalizeFsPath } from '@utils';
import type { Plugin } from 'rollup';

import { InMemoryFileSystem } from '../sys/in-memory-fs';

export const fileLoadPlugin = (fs: InMemoryFileSystem): Plugin => {
  return {
    name: 'fileLoadPlugin',

    load(id) {
      const fsFilePath = normalizeFsPath(id);
      if (id.endsWith('.d.ts') || id.endsWith('.d.mts')) {
        return '';
      }
      return fs.readFile(fsFilePath);
    },
  };
};
