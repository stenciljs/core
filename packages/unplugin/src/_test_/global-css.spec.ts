import { mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { JsonDocsComponent } from '@stencil/core/compiler';

import { getHydrateTagNames, writeVirtualGlobalStylesheets } from '../global-css.js';
import type { GlobalCssProjectData } from '../global-css.js';

describe('getHydrateTagNames', () => {
  it('excludes CSS-only components, which never hydrate', () => {
    const components = [
      { tag: 'my-cmp' },
      { tag: 'my-css-badge', cssOnly: true },
    ] as JsonDocsComponent[];

    expect(getHydrateTagNames(components)).toEqual(new Set(['my-cmp']));
  });
});

describe('writeVirtualGlobalStylesheets', () => {
  let dir: string;
  let genDir: string;
  const read = (name: string) => readFileSync(join(genDir, `${name}.css`), 'utf-8');

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'stencil-unplugin-global-css-'));
    genDir = join(dir, 'gen');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("writes each import's CSS and reports its ingredient files", async () => {
    const globalFile = join(dir, 'global.css');
    const badgeFile = join(dir, 'my-badge.css');
    writeFileSync(globalFile, '.app { display: flex; }');
    writeFileSync(badgeFile, 'my-badge { --my-badge-gap: 4px; }');

    const { deps } = await writeVirtualGlobalStylesheets(
      genDir,
      {
        componentGlobalStyles: [
          { absolutePath: null, styleStr: ':root { --x: 1; }' },
          { absolutePath: globalFile, styleStr: null },
        ],
        cssOnlyComponentFiles: new Set([badgeFile]),
        tagNames: new Set(['my-cmp']),
        hydratedFlag: {
          selector: 'class',
          name: 'hydrated',
          property: 'visibility',
          initialValue: 'hidden',
          hydratedValue: 'inherit',
        },
      },
      true,
    );

    expect(read('stencil-hydrate')).toBe('my-cmp{visibility:hidden}.hydrated{visibility:inherit}');
    expect(read('stencil-component-globals')).toContain(':root { --x: 1; }');
    expect(read('stencil-component-globals')).toContain('flex');
    expect(read('stencil-css-components')).toContain('--my-badge-gap');
    expect(deps).toEqual(expect.arrayContaining([globalFile, badgeFile]));
  });

  it('picks up an ingredient change on the next write, without being told', async () => {
    const file = join(dir, 'my-badge.css');
    writeFileSync(file, 'my-badge { padding: 4px; }');
    const data: GlobalCssProjectData = {
      componentGlobalStyles: [],
      cssOnlyComponentFiles: new Set([file]),
      tagNames: new Set(),
      hydratedFlag: null,
    };
    await writeVirtualGlobalStylesheets(genDir, data, true);

    writeFileSync(file, 'my-badge { padding: 9px; }');
    // make sure the mtime moves even on coarse-grained filesystems
    const later = new Date(Date.now() + 5000);
    utimesSync(file, later, later);
    const { written } = await writeVirtualGlobalStylesheets(genDir, data, true);

    expect(read('stencil-css-components')).toContain('9px');
    expect(written).toEqual([join(genDir, 'stencil-css-components.css')]);
  });
});
