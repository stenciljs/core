import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { describe, expect, it } from 'vitest';
import type { HmrContext, Plugin } from 'vite';

import { stencilVite } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// a CSS-only component of its own, so adding/removing it can't disturb tests running alongside
const typesBadgePath = join(__dirname, 'fixtures', 'virtual-css', 'types-badge.css');
const typesCmpPath = join(__dirname, 'fixtures', 'types-cmp.tsx');
const typesCmp = (prop: string) =>
  `import { Component, Prop, h } from '@stencil/core';\n` +
  `@Component({ tag: 'types-cmp' })\n` +
  `export class TypesCmp {\n  @Prop() ${prop}: string;\n  render() { return <div />; }\n}\n`;

describe('components.d.ts generation (`types: true`) under Vite', () => {
  it('writes it at startup and keeps it current as components come, change and go', async () => {
    // the project scan runs from cwd (this package's fixtures); only the output goes to srcDir
    // canonical path - Windows' temp dir can be an 8.3 short path (`RUNNER~1`), which Vite
    // resolves to the long form, so the id it resolves wouldn't match the file it loads
    const srcDir = realpathSync.native(mkdtempSync(join(tmpdir(), 'stencil-unplugin-types-')));
    const dtsPath = join(srcDir, 'components.d.ts');
    const server = await createServer({
      root: srcDir,
      configFile: false,
      logLevel: 'silent',
      plugins: [stencilVite({ types: true, stencilConfig: { srcDir } })],
      server: { middlewareMode: true, hmr: false, watch: null },
    });
    const plugin = server.config.plugins.find((p) => p.name === '@stencil/unplugin') as Plugin;
    const handleHotUpdate = plugin.handleHotUpdate as (ctx: HmrContext) => Promise<unknown>;
    const hotUpdate = (file: string) =>
      handleHotUpdate({ file, server, modules: [], timestamp: Date.now(), read: async () => '' });

    try {
      await server.pluginContainer.buildStart({});
      const initial = readFileSync(dtsPath, 'utf-8');
      // a JS-backed component and a CSS-only one from the fixtures
      expect(initial).toContain('"my-button": LocalJSX.IntrinsicElements["my-button"]');
      expect(initial).toContain('"my-css-badge": LocalJSX.IntrinsicElements["my-css-badge"]');
      expect(initial).not.toContain('types-badge');

      writeFileSync(typesBadgePath, '/**\n * @component\n */\ntypes-badge {\n  padding: 1px;\n}\n');
      await hotUpdate(typesBadgePath);
      expect(readFileSync(dtsPath, 'utf-8')).toContain('"types-badge": HTMLTypesBadgeElement;');

      rmSync(typesBadgePath, { force: true });
      await hotUpdate(typesBadgePath);
      expect(readFileSync(dtsPath, 'utf-8')).toBe(initial);

      writeFileSync(typesCmpPath, typesCmp('first'));
      await hotUpdate(typesCmpPath);
      expect(readFileSync(dtsPath, 'utf-8')).toMatch(/interface TypesCmp \{\s*"first": string;/);

      writeFileSync(typesCmpPath, typesCmp('renamed'));
      await hotUpdate(typesCmpPath);
      expect(readFileSync(dtsPath, 'utf-8')).toMatch(/interface TypesCmp \{\s*"renamed": string;/);

      rmSync(typesCmpPath, { force: true });
      await hotUpdate(typesCmpPath);
      expect(readFileSync(dtsPath, 'utf-8')).toBe(initial);
    } finally {
      rmSync(typesBadgePath, { force: true });
      rmSync(typesCmpPath, { force: true });
      await server.close();
      rmSync(srcDir, { recursive: true, force: true });
    }
  });
});
