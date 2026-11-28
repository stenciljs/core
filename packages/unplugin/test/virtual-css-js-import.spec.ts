import {
  existsSync,
  mkdtempSync,
  realpathSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';
import { describe, expect, it } from 'vitest';

import { stencilVite } from '../src/index.js';

describe('virtual global stylesheets imported from JS under Vite', () => {
  it('generates them even when no stylesheet mentions one', async () => {
    // a root with no stylesheets at all, so nothing trips the "is it used?" text scan. Canonical:
    // Windows' temp dir can be an 8.3 short path (`RUNNER~1`), which Vite resolves to the long
    // form, so the id it resolves wouldn't match the file it loads
    const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'stencil-unplugin-js-import-')));
    writeFileSync(join(root, 'entry.js'), "import 'stencil-css-components';\n");
    const generatedPath = join(
      root,
      'node_modules',
      '.stencil',
      'virtual-css',
      'serve',
      'stencil-css-components.css',
    );
    const server = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [stencilVite()],
      server: { middlewareMode: true, hmr: false, watch: null },
    });

    try {
      const result = await server.transformRequest('/entry.js');
      expect(result?.code).toContain('stencil-css-components.css');
      expect(existsSync(generatedPath)).toBe(true);
      // the project scan runs from cwd - this package's own fixtures
      expect(readFileSync(generatedPath, 'utf-8')).toContain('my-css-badge');
    } finally {
      await server.close();
      rmSync(root, { recursive: true, force: true });
    }
  });
});
