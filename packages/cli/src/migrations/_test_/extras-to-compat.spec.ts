import ts from 'typescript';
import { describe, it, expect } from 'vitest';

import { extrasToCompatRule } from '../rules/extras-to-compat';

const parse = (source: string) =>
  ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);

describe('extras-to-compat migration', () => {
  describe('detect', () => {
    it('detects extras key', () => {
      const source = `export const config: Config = {
  extras: { enableImportInjection: true },
};`;
      const matches = extrasToCompatRule.detect(parse(source));
      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain("'extras' has been renamed to 'compat'");
    });

    it('returns no matches when no extras key', () => {
      const source = `export const config: Config = {
  namespace: 'MyApp',
};`;
      expect(extrasToCompatRule.detect(parse(source))).toHaveLength(0);
    });
  });

  describe('transform', () => {
    it('renames extras to compat', () => {
      const source = `export const config: Config = {
  extras: {
    enableImportInjection: true,
    initializeNextTick: false,
  },
};`;
      const sourceFile = parse(source);
      const matches = extrasToCompatRule.detect(sourceFile);
      const result = extrasToCompatRule.transform(sourceFile, matches);
      expect(result).toContain('compat:');
      expect(result).not.toContain('extras:');
      expect(result).toContain('enableImportInjection: true');
      expect(result).toContain('initializeNextTick: false');
    });

    it('returns unchanged source when no matches', () => {
      const source = `export const config: Config = { namespace: 'App' };`;
      const sourceFile = parse(source);
      const result = extrasToCompatRule.transform(sourceFile, []);
      expect(result).toBe(source);
    });
  });
});
