import MagicString from 'magic-string';
import type { Plugin } from 'rolldown';

/**
 * With `platform: 'browser'` (shared with the ESM output), Rolldown renders `import.meta.url`
 * in CJS as `{}.url`. Replace it with the same expression Rolldown emits for `platform: 'node'`.
 */
const EMPTY_IMPORT_META_URL = /\{\}\.url\b/g;
const CJS_FILE_URL = `require("url").pathToFileURL(__filename).href`;

/**
 * A Rolldown output plugin that restores `import.meta.url` in CJS chunks.
 * @param sourceMap whether to generate a source map for the replacement
 * @returns a Rolldown plugin
 */
export const cjsImportMetaUrlPlugin = (sourceMap: boolean): Plugin => ({
  name: 'cjsImportMetaUrlPlugin',
  renderChunk(code) {
    if (!code.includes('{}.url')) return null;

    const s = new MagicString(code);
    s.replaceAll(EMPTY_IMPORT_META_URL, CJS_FILE_URL);
    return {
      code: s.toString(),
      map: sourceMap ? s.generateMap({ hires: true }) : null,
    };
  },
});
