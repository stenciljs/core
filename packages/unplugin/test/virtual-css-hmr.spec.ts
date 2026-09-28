import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { describe, expect, it } from 'vitest';
import type { HmrContext, ModuleNode, Plugin } from 'vite';

import { stencilVite } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, '..');
// a CSS-only component of its own, so editing it can't disturb tests running alongside
const badgePath = join(__dirname, 'fixtures', 'virtual-css', 'hmr-badge.css');
const badgeCss = (padding: string) => `/** @component */\nhmr-badge {\n  padding: ${padding};\n}\n`;
const generatedPath = join(
  pkgRoot,
  'node_modules',
  '.stencil',
  'virtual-css',
  'serve',
  'stencil-css-components.css',
);

describe('virtual global-stylesheet HMR under Vite', () => {
  it('regenerates and hot-updates when a CSS-only component changes', async () => {
    writeFileSync(badgePath, badgeCss('4px'));
    const server = await createServer({
      root: pkgRoot,
      configFile: false,
      logLevel: 'silent',
      plugins: [stencilVite()],
      server: { middlewareMode: true, hmr: false, watch: null },
    });

    try {
      // seed the module graph the way a browser request would
      await server.transformRequest('/test/fixtures/virtual-css/partial.css');
      expect(readFileSync(generatedPath, 'utf-8')).toMatch(/hmr-badge\s*\{\s*padding:\s*4px/);

      writeFileSync(badgePath, badgeCss('9px'));

      const plugin = server.config.plugins.find((p) => p.name === '@stencil/unplugin') as Plugin;
      const handleHotUpdate = plugin.handleHotUpdate as (ctx: HmrContext) => Promise<ModuleNode[]>;
      const updated = await handleHotUpdate({
        file: badgePath,
        server,
        modules: [],
        timestamp: Date.now(),
        read: async () => readFileSync(badgePath, 'utf-8'),
      });

      expect(readFileSync(generatedPath, 'utf-8')).toMatch(/hmr-badge\s*\{\s*padding:\s*9px/);
      const generated = updated.find((m) => m.file === generatedPath);
      expect(generated).toBeTruthy();
      // Vite propagates the update through the importing stylesheet, which self-accepts
      expect([...generated!.importers].map((m) => m.file)).toContain(
        join(pkgRoot, 'test', 'fixtures', 'virtual-css', 'partial.css'),
      );
    } finally {
      rmSync(badgePath, { force: true });
      await server.close();
    }
  });
});
