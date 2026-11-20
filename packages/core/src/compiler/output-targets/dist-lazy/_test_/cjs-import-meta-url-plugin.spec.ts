import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { rolldown } from 'rolldown';
import { describe, expect, it } from 'vitest';

import { cjsImportMetaUrlPlugin } from '../cjs-import-meta-url-plugin';

const ENTRY_ID = 'entry.js';

const bundleCjs = async (source: string, plugins = [cjsImportMetaUrlPlugin(false)]) => {
  const build = await rolldown({
    input: ENTRY_ID,
    platform: 'browser',
    logLevel: 'silent',
    plugins: [
      {
        name: 'virtual-entry',
        resolveId: (id) => (id === ENTRY_ID ? id : null),
        load: (id) => (id === ENTRY_ID ? source : null),
      },
    ],
  });
  const { output } = await build.generate({ format: 'cjs', plugins });
  return output[0].code;
};

describe('cjsImportMetaUrlPlugin', () => {
  const source = `export const url = new URL('../assets/', String(import.meta.url)).href;`;

  it('renders `import.meta.url` as `{}.url` without the plugin', async () => {
    expect(await bundleCjs(source, [])).toContain('String({}.url)');
  });

  it('resolves `import.meta.url` from `__filename`', async () => {
    const code = await bundleCjs(source);
    expect(code).toContain('String(require("url").pathToFileURL(__filename).href)');
    expect(code).not.toContain('{}.url');
  });

  it('produces a URL that evaluates under CommonJS', async () => {
    const code = await bundleCjs(source);
    const module = { exports: {} as { url?: string } };
    const filename = resolve('/pkg/dist/cjs/loader.cjs');
    new Function('module', 'exports', 'require', '__filename', code)(
      module,
      module.exports,
      require,
      filename,
    );
    // resolved per platform (Windows adds a drive letter)
    expect(module.exports.url).toBe(pathToFileURL(resolve('/pkg/dist/assets')).href + '/');
  });
});
