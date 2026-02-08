import type * as d from '../../../../declarations';
import { createSystem } from '../../../sys/stencil-sys';
import { ensureExtension } from '../typescript-resolve-module';

describe('typescript resolve module', () => {
  const config: d.Config = { rootDir: '/some/path' };

  beforeEach(() => {
    config.rootDir = '/some/path';
    config.sys = createSystem();
  });

  describe('ensureExtension', () => {
    it('add d.ts ext as the containing url', () => {
      const url = 'http://stencil.com/filename';
      const containingUrl = 'http://stencil.com/index.d.ts';
      const r = ensureExtension(url, containingUrl);
      expect(r).toBe('http://stencil.com/filename.d.ts');
    });

    it('add js ext as the containing url', () => {
      const url = 'http://stencil.com/filename';
      const containingUrl = 'http://stencil.com/index.js';
      const r = ensureExtension(url, containingUrl);
      expect(r).toBe('http://stencil.com/filename.js');
    });

    it('do nothing when url already had an ext', () => {
      const url = 'http://stencil.com/filename.js';
      const containingUrl = 'http://stencil.com/index.js';
      const r = ensureExtension(url, containingUrl);
      expect(r).toBe(url);
    });
  });
});
