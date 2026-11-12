import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import type { CustomElementsManifest } from '@stencil/core/compiler';

import { getStencilCEM, stencilVite } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

const findCssProperties = (cem: CustomElementsManifest, tagName: string) =>
  cem.modules
    .flatMap((mod) => mod.declarations ?? [])
    .find((d) => 'tagName' in d && d.tagName === tagName)?.cssProperties;

// No live Vite dev server here - `handleHotUpdate` only touches `server.ws`/`server.moduleGraph`,
// so a minimal stub is enough to drive it directly.
const fakeServer = {
  ws: { send: vi.fn() },
  moduleGraph: {
    invalidateModule: vi.fn(),
    getModuleById: () => undefined,
    idToModuleMap: new Map(),
  },
};

// `stencilVite()` returns a `Plugin | Plugin[]` per Vite's own types, and each hook's type is a
// union of "plain function" or "{ handler }" object - true in general, but not how this plugin
// ever constructs them. This narrows to the concrete shape actually driven below.
interface TestablePlugin {
  buildStart(this: unknown): Promise<void>;
  transform(this: unknown, code: string, id: string): Promise<{ code: string } | null>;
  resolveId(this: unknown, id: string, importer: string): Promise<string | null>;
  load(this: { addWatchFile(id: string): void }, id: string): Promise<unknown>;
  handleHotUpdate(ctx: { file: string; server: typeof fakeServer }): Promise<unknown>;
}

describe('@stencil/unplugin docs HMR refresh', () => {
  it("refreshes a regular component's docs when its *linked* stylesheet changes, not just its .tsx", async () => {
    const plugin = stencilVite({ docs: true }) as unknown as TestablePlugin;
    await plugin.buildStart();

    // Drive the same resolveId -> load sequence a bundler would, so cssFileToTagNames/tagToFile
    // (only populated by actually processing the component, not by the eager buildStart scan) get seeded.
    const tsxPath = join(fixturesDir, 'my-styled.tsx');
    const cssPath = join(fixturesDir, 'my-styled.css');
    const originalCss = readFileSync(cssPath, 'utf-8');

    const tsxCode = readFileSync(tsxPath, 'utf-8');
    const transformed = await plugin.transform(tsxCode, tsxPath);
    const cssSpecifier = transformed!.code.match(/from ['"]([^'"]+\.css\?[^'"]+)['"]/)?.[1];
    expect(cssSpecifier).toBeTruthy();

    const virtualId = await plugin.resolveId(cssSpecifier!, tsxPath);
    expect(virtualId).toBeTruthy();
    await plugin.load.call({ addWatchFile: () => {} }, virtualId!);

    try {
      // Baseline: the accent custom property from the fixture is already documented.
      expect(findCssProperties(getStencilCEM(), 'my-styled')).toEqual([
        { name: '--my-styled-accent', description: 'Accent color for the styled box.' },
      ]);

      // Edit the linked stylesheet - not the .tsx - and let handleHotUpdate pick it up.
      writeFileSync(
        cssPath,
        originalCss.replace('Accent color for the styled box.', 'Updated accent color.'),
      );

      await plugin.handleHotUpdate({ file: cssPath, server: fakeServer });

      expect(findCssProperties(getStencilCEM(), 'my-styled')).toEqual([
        { name: '--my-styled-accent', description: 'Updated accent color.' },
      ]);
      // The assertion above is on server-side state `handleHotUpdate` refreshed - a full reload
      // alone (client re-fetching unchanged server state) would not have caught this.
      expect(fakeServer.ws.send).toHaveBeenCalledWith({
        type: 'custom',
        event: 'stencil:docs-update',
      });
    } finally {
      writeFileSync(cssPath, originalCss);
    }
  });
});
