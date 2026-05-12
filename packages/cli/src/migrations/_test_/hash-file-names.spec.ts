import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { hashFileNamesRule } from '../rules/hash-file-names';

function createSourceFile(code: string): ts.SourceFile {
  return ts.createSourceFile('stencil.config.ts', code, ts.ScriptTarget.Latest, true);
}

function transform(code: string): string {
  const sf = createSourceFile(code);
  const matches = hashFileNamesRule.detect(sf);
  return hashFileNamesRule.transform(sf, matches);
}

describe('hashFileNamesRule', () => {
  describe('detect', () => {
    it('detects top-level hashFileNames', () => {
      const sf = createSourceFile(`export const config = { hashFileNames: false };`);
      expect(hashFileNamesRule.detect(sf)).toHaveLength(1);
    });

    it('detects top-level hashedFileNameLength', () => {
      const sf = createSourceFile(`export const config = { hashedFileNameLength: 12 };`);
      expect(hashFileNamesRule.detect(sf)).toHaveLength(1);
    });

    it('detects both top-level props', () => {
      const sf = createSourceFile(
        `export const config = { hashFileNames: false, hashedFileNameLength: 12 };`,
      );
      expect(hashFileNamesRule.detect(sf)).toHaveLength(2);
    });

    it('does not detect hashFileNames inside a loader-bundle output target', () => {
      const sf = createSourceFile(
        `export const config = { outputTargets: [{ type: 'loader-bundle', hashFileNames: false }] };`,
      );
      expect(hashFileNamesRule.detect(sf)).toHaveLength(0);
    });

    it('does not detect hashFileNames inside a www output target', () => {
      const sf = createSourceFile(
        `export const config = { outputTargets: [{ type: 'www', hashFileNames: false }] };`,
      );
      expect(hashFileNamesRule.detect(sf)).toHaveLength(0);
    });

    it('returns empty for a config with no hash properties', () => {
      const sf = createSourceFile(`export const config = { namespace: 'my-lib' };`);
      expect(hashFileNamesRule.detect(sf)).toHaveLength(0);
    });
  });

  describe('transform — single-line output target', () => {
    it('injects hashFileNames into single-line loader-bundle', () => {
      const result = transform(`export const config = {
  hashFileNames: false,
  outputTargets: [{ type: 'loader-bundle' }],
};`);
      expect(result).not.toMatch(/^\s+hashFileNames: false,$/m);
      expect(result).toContain(`{ type: 'loader-bundle', hashFileNames: false }`);
    });

    it('injects hashFileNames into single-line www', () => {
      const result = transform(`export const config = {
  hashFileNames: false,
  outputTargets: [{ type: 'www' }],
};`);
      expect(result).toContain(`{ type: 'www', hashFileNames: false }`);
    });

    it('injects into both single-line loader-bundle and www', () => {
      const result = transform(`export const config = {
  hashFileNames: false,
  outputTargets: [{ type: 'loader-bundle' }, { type: 'www' }],
};`);
      expect(result).toContain("{ type: 'loader-bundle', hashFileNames: false }");
      expect(result).toContain("{ type: 'www', hashFileNames: false }");
    });
  });

  describe('transform — multi-line output target', () => {
    it('injects hashFileNames into multi-line loader-bundle on its own line', () => {
      const result = transform(`export const config = {
  hashFileNames: false,
  outputTargets: [
    {
      type: 'loader-bundle',
      empty: true,
    },
  ],
};`);
      expect(result).not.toContain('hashFileNames: false,\n  outputTargets');
      expect(result).toContain('hashFileNames: false,\n    },');
    });

    it('injects hashedFileNameLength into multi-line www on its own line', () => {
      const result = transform(`export const config = {
  hashedFileNameLength: 12,
  outputTargets: [
    {
      type: 'www',
      dir: 'www',
    },
  ],
};`);
      expect(result).toContain('hashedFileNameLength: 12,\n    },');
    });

    it('injects both props when both are at top level', () => {
      const result = transform(`export const config = {
  hashFileNames: false,
  hashedFileNameLength: 12,
  outputTargets: [
    {
      type: 'loader-bundle',
    },
  ],
};`);
      expect(result).toContain('hashFileNames: false,');
      expect(result).toContain('hashedFileNameLength: 12,');
      // Neither should remain at top level
      expect(result).not.toMatch(/^  hashFileNames/m);
      expect(result).not.toMatch(/^  hashedFileNameLength/m);
    });
  });

  describe('transform — edge cases', () => {
    it('removes top-level prop even when no matching output targets exist', () => {
      const result = transform(`export const config = {
  hashFileNames: false,
  outputTargets: [{ type: 'standalone' }],
};`);
      expect(result).not.toContain('hashFileNames');
    });

    it('does not duplicate if output target already has the prop', () => {
      const result = transform(`export const config = {
  hashFileNames: false,
  outputTargets: [{ type: 'loader-bundle', hashFileNames: true }],
};`);
      // Only the output target's hashFileNames should remain (not the removed top-level one)
      const count = (result.match(/hashFileNames/g) ?? []).length;
      expect(count).toBe(1);
      expect(result).toContain('hashFileNames: true');
    });

    it('does not modify a config with no hash props', () => {
      const code = `export const config = { namespace: 'my-lib' };`;
      expect(transform(code)).toBe(code);
    });
  });
});
