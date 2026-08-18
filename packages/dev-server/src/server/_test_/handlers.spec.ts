import { describe, expect, it } from 'vitest';

import { hasNestedHtmlFile } from '../handlers';
import type { DevServerContext } from '../types';

const mockSys = (filesByDir: Record<string, string[]>): DevServerContext['sys'] =>
  ({
    readDir: async (p: string) => filesByDir[p] ?? [],
    stat: async (p: string) => ({
      isDirectory: !p.includes('.'),
      isFile: p.includes('.'),
      isSymbolicLink: false,
      size: 0,
      error: null,
    }),
  }) as unknown as DevServerContext['sys'];

describe('hasNestedHtmlFile', () => {
  it('returns false when there are no html files anywhere in the tree', async () => {
    const sys = mockSys({
      '/src/my-cmp': ['/src/my-cmp/my-cmp.tsx', '/src/my-cmp/usage'],
      '/src/my-cmp/usage': ['/src/my-cmp/usage/basic.md'],
    });

    const result = await hasNestedHtmlFile(sys, await sys.readDir('/src/my-cmp'));
    expect(result).toBe(false);
  });

  it('returns true when an html file is at the top level', async () => {
    const sys = mockSys({
      '/src/my-cmp': ['/src/my-cmp/my-cmp.tsx', '/src/my-cmp/index.html'],
    });

    const result = await hasNestedHtmlFile(sys, await sys.readDir('/src/my-cmp'));
    expect(result).toBe(true);
  });

  it('returns true when an html file is nested in a subdirectory', async () => {
    const sys = mockSys({
      '/src/my-cmp': ['/src/my-cmp/my-cmp.tsx', '/src/my-cmp/demos'],
      '/src/my-cmp/demos': ['/src/my-cmp/demos/custom.html'],
    });

    const result = await hasNestedHtmlFile(sys, await sys.readDir('/src/my-cmp'));
    expect(result).toBe(true);
  });

  it('returns true when an html file is nested multiple levels deep', async () => {
    const sys = mockSys({
      '/src/my-cmp': ['/src/my-cmp/my-cmp.tsx', '/src/my-cmp/demos'],
      '/src/my-cmp/demos': ['/src/my-cmp/demos/nested'],
      '/src/my-cmp/demos/nested': ['/src/my-cmp/demos/nested/deep.html'],
    });

    const result = await hasNestedHtmlFile(sys, await sys.readDir('/src/my-cmp'));
    expect(result).toBe(true);
  });
});
