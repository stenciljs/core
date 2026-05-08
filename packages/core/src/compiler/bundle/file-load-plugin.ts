import { dirname, isAbsolute, join } from 'path';
import type { Plugin } from 'rolldown';

import { isDtsFile, normalizeFsPath } from '../../utils';
import { InMemoryFileSystem } from '../sys/in-memory-fs';

// Extensions tried in order when resolving extensionless imports
const RESOLVE_EXTENSIONS = ['.tsx', '.ts', '.mts', '.cts', '.js', '.mjs', '.cjs'];

export const fileLoadPlugin = (fs: InMemoryFileSystem): Plugin => {
  return {
    name: 'fileLoadPlugin',

    // Confirm paths that exist only in the in-memory FS so rolldown's native
    // disk resolver doesn't reject virtual files before the load hook runs.
    resolveId(id, importer) {
      // Preserve query params (e.g. ?tag=cmp-a) — strip only for FS lookup,
      // then re-attach so extTransformsPlugin.transform can parse them.
      const qIdx = id.indexOf('?');
      const query = qIdx !== -1 ? id.slice(qIdx) : '';
      const idBase = qIdx !== -1 ? id.slice(0, qIdx) : id;

      const candidates: string[] = [];

      if (isAbsolute(idBase)) {
        const base = normalizeFsPath(idBase);
        candidates.push(base, ...RESOLVE_EXTENSIONS.map((ext) => base + ext));
      } else if (idBase.startsWith('.') && importer) {
        const base = join(dirname(normalizeFsPath(importer)), idBase);
        candidates.push(base, ...RESOLVE_EXTENSIONS.map((ext) => base + ext));
      }

      for (const p of candidates) {
        if (fs.statSync(p)?.isFile) {
          return { id: p + query };
        }
      }
      return null;
    },

    load(id) {
      const fsFilePath = normalizeFsPath(id);
      if (isDtsFile(fsFilePath)) {
        return '';
      }
      return fs.readFile(fsFilePath);
    },
  };
};
