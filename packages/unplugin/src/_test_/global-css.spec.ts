import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  hasVirtualGlobalImport,
  invalidateGlobalCssFile,
  resolveVirtualGlobalImports,
} from '../global-css.js';
import type { GlobalCssProjectData } from '../global-css.js';

const emptyData: GlobalCssProjectData = {
  componentGlobalStyles: [],
  cssOnlyComponentFiles: new Set(),
  tagNames: new Set(),
  hydratedFlag: null,
};

describe('hasVirtualGlobalImport', () => {
  it('detects each of the three virtual specifiers', () => {
    expect(hasVirtualGlobalImport('@import "stencil-globals";')).toBe(true);
    expect(hasVirtualGlobalImport('@import "stencil-hydrate";')).toBe(true);
    expect(hasVirtualGlobalImport('@import "stencil-css-components";')).toBe(true);
  });

  it('returns false for css with no virtual import', () => {
    expect(hasVirtualGlobalImport('body { color: red; }')).toBe(false);
    expect(hasVirtualGlobalImport('@import "./local.css";')).toBe(false);
  });
});

describe('resolveVirtualGlobalImports', () => {
  it('leaves css without any virtual import unchanged and returns no deps', async () => {
    const css = 'body { color: red; }';
    const result = await resolveVirtualGlobalImports(css, emptyData, true);
    expect(result.code).toBe(css);
    expect(result.deps).toEqual([]);
  });

  it('replaces stencil-globals with inline component globalStyle text', async () => {
    const data: GlobalCssProjectData = {
      ...emptyData,
      componentGlobalStyles: [{ absolutePath: null, styleStr: ':root { --x: 1; }' }],
    };
    const result = await resolveVirtualGlobalImports('@import "stencil-globals";', data, true);
    expect(result.code).not.toContain('@import "stencil-globals"');
    expect(result.code).toContain(':root { --x: 1; }');
  });

  it('replaces stencil-hydrate with generated FOUC css for the given tags', async () => {
    const data: GlobalCssProjectData = {
      ...emptyData,
      tagNames: new Set(['my-cmp']),
      hydratedFlag: {
        selector: 'class',
        name: 'hydrated',
        property: 'visibility',
        initialValue: 'hidden',
        hydratedValue: 'inherit',
      },
    };
    const result = await resolveVirtualGlobalImports('@import "stencil-hydrate";', data, true);
    expect(result.code).toContain('my-cmp{visibility:hidden}.hydrated{visibility:inherit}');
  });

  it('produces no hydrate css when hydratedFlag is null', async () => {
    const data: GlobalCssProjectData = { ...emptyData, tagNames: new Set(['my-cmp']) };
    const result = await resolveVirtualGlobalImports('@import "stencil-hydrate";', data, true);
    expect(result.code).not.toContain('@import "stencil-hydrate"');
    expect(result.code.trim()).toBe('');
  });

  it('replaces stencil-css-components with every css-only-component file and tracks them as deps', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'stencil-unplugin-global-css-'));
    const file = join(dir, 'my-badge.css');
    writeFileSync(file, 'my-badge { --my-badge-gap: 4px; }');
    try {
      const data: GlobalCssProjectData = { ...emptyData, cssOnlyComponentFiles: new Set([file]) };
      const result = await resolveVirtualGlobalImports(
        '@import "stencil-css-components";',
        data,
        true,
      );
      expect(result.code).not.toContain('@import "stencil-css-components"');
      expect(result.code).toContain('my-badge');
      expect(result.code).toContain('--my-badge-gap');
      expect(result.deps).toContain(file);
    } finally {
      invalidateGlobalCssFile(file);
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('resolves a component globalStyleUrl from a real file and tracks it as a dep', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'stencil-unplugin-global-css-'));
    const file = join(dir, 'global.css');
    writeFileSync(file, '.app { display: flex; }');
    try {
      const data: GlobalCssProjectData = {
        ...emptyData,
        componentGlobalStyles: [{ absolutePath: file, styleStr: null }],
      };
      const result = await resolveVirtualGlobalImports('@import "stencil-globals";', data, true);
      expect(result.code).toContain('flex');
      expect(result.deps).toContain(file);
    } finally {
      invalidateGlobalCssFile(file);
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('resolves all three virtual imports in the same file', async () => {
    const data: GlobalCssProjectData = {
      componentGlobalStyles: [{ absolutePath: null, styleStr: '.g {}' }],
      cssOnlyComponentFiles: new Set(),
      tagNames: new Set(['my-cmp']),
      hydratedFlag: {
        selector: 'class',
        name: 'hydrated',
        property: 'visibility',
        initialValue: 'hidden',
        hydratedValue: 'inherit',
      },
    };
    const css = `@import "stencil-globals";\n@import "stencil-hydrate";\n@import "stencil-css-components";`;
    const result = await resolveVirtualGlobalImports(css, data, true);
    expect(result.code).not.toContain('@import');
    expect(result.code).toContain('.g {}');
    expect(result.code).toContain('my-cmp{visibility:hidden}');
  });
});
