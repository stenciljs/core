import { describe, expect, it } from 'vitest';

import { getRealCssPath, isStencilCss, loadStencilCss, resolveStencilCss } from '../css.js';

describe('resolveStencilCss', () => {
  it('resolves a relative Stencil CSS import to a virtual module id', () => {
    const id = resolveStencilCss(
      './my-card.css?tag=my-card&encapsulation=shadow',
      '/src/my-card.tsx',
    );
    expect(id).toMatch(/^\x00stencil-css:/);
    // Extension is stripped from path and stored dotless as __ext
    expect(id).not.toMatch(/my-card\.css/);
    expect(id).toContain('my-card');
    expect(id).toContain('tag=my-card');
    expect(id).toContain('__ext=css'); // dotless — avoids Vite CSS_LANGS_RE match
  });

  it('returns null for non-Stencil CSS specifiers', () => {
    expect(resolveStencilCss('./foo.css', '/src/bar.tsx')).toBeNull();
    expect(resolveStencilCss('./foo.css?inline', '/src/bar.tsx')).toBeNull();
    expect(resolveStencilCss('./utils.ts', '/src/bar.tsx')).toBeNull();
  });
});

describe('isStencilCss', () => {
  it('identifies virtual stencil css ids', () => {
    expect(isStencilCss('\x00stencil-css:/src/foo?tag=foo&encapsulation=shadow&__ext=css')).toBe(
      true,
    );
    expect(isStencilCss('\x00stencil-css:/src/foo?tag=foo&__ext=css')).toBe(true);
    // Raw query-param paths (pre-resolve) are NOT matched — resolveId runs first
    expect(isStencilCss('/src/foo.css?tag=foo')).toBe(false);
    expect(isStencilCss('/src/foo.css')).toBe(false);
    expect(isStencilCss('/src/foo.tsx')).toBe(false);
  });
});

describe('getRealCssPath', () => {
  it('extracts the real file path from a virtual module id', () => {
    expect(getRealCssPath('\x00stencil-css:/src/my-card?tag=my-card&__ext=css')).toBe(
      '/src/my-card.css',
    );
    expect(
      getRealCssPath('\x00stencil-css:/src/my-cmp?tag=my-cmp&encapsulation=scoped&__ext=scss'),
    ).toBe('/src/my-cmp.scss');
  });

  it('returns null for non-stencil-css ids', () => {
    expect(getRealCssPath('/src/foo.css')).toBeNull();
  });
});

describe('loadStencilCss', () => {
  it('returns null for non-stencil-css ids', async () => {
    expect(await loadStencilCss('/src/foo.css', true)).toBeNull();
  });

  it('returns empty string export for missing css file', async () => {
    const result = await loadStencilCss(
      '\x00stencil-css:/nonexistent/file?tag=missing-cmp&encapsulation=shadow&__ext=css',
      true,
    );
    expect(result?.code).toBe('export default () => ""');
    expect(result?.deps).toEqual([]);
  });
});
