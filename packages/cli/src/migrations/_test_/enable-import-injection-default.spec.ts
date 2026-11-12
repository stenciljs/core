import ts from 'typescript';
import { describe, it, expect } from 'vitest';

import { enableImportInjectionDefaultRule } from '../rules/enable-import-injection-default';

const parse = (source: string) =>
  ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);

describe('enable-import-injection-default migration', () => {
  describe('detect', () => {
    it('detects extras.enableImportInjection: true', () => {
      const source = `export const config: Config = {
  extras: { enableImportInjection: true },
};`;
      const matches = enableImportInjectionDefaultRule.detect(parse(source));
      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain("'extras.enableImportInjection: true'");
    });

    it('does not match enableImportInjection: false', () => {
      const source = `export const config: Config = {
  extras: { enableImportInjection: false },
};`;
      expect(enableImportInjectionDefaultRule.detect(parse(source))).toHaveLength(0);
    });

    it('does not match a dynamic value', () => {
      const source = `export const config: Config = {
  extras: { enableImportInjection: someFlag },
};`;
      expect(enableImportInjectionDefaultRule.detect(parse(source))).toHaveLength(0);
    });

    it('does not match outside of extras', () => {
      const source = `export const config: Config = {
  compat: { enableImportInjection: true },
};`;
      expect(enableImportInjectionDefaultRule.detect(parse(source))).toHaveLength(0);
    });

    it('returns no matches when there is nothing to migrate', () => {
      const source = `export const config: Config = {
  namespace: 'MyApp',
};`;
      expect(enableImportInjectionDefaultRule.detect(parse(source))).toHaveLength(0);
    });
  });

  describe('transform', () => {
    it('removes enableImportInjection: true and keeps sibling flags', () => {
      const source = `export const config: Config = {
  extras: {
    enableImportInjection: true,
    initializeNextTick: false,
  },
};`;
      const sourceFile = parse(source);
      const matches = enableImportInjectionDefaultRule.detect(sourceFile);
      const result = enableImportInjectionDefaultRule.transform(sourceFile, matches);
      expect(result).not.toContain('enableImportInjection');
      expect(result).toContain('initializeNextTick: false');

      // Result should still be valid, parseable TypeScript
      const reparsed = parse(result);
      expect(reparsed.statements.length).toBeGreaterThan(0);
    });

    it('removes the extras object entirely when it becomes empty', () => {
      const source = `export const config: Config = {
  namespace: 'MyApp',
  extras: { enableImportInjection: true },
};`;
      const sourceFile = parse(source);
      const matches = enableImportInjectionDefaultRule.detect(sourceFile);
      const result = enableImportInjectionDefaultRule.transform(sourceFile, matches);
      expect(result).not.toContain('extras');
      expect(result).not.toContain('enableImportInjection');
      expect(result).toContain("namespace: 'MyApp'");
    });

    it('returns unchanged source when no matches', () => {
      const source = `export const config: Config = { namespace: 'App' };`;
      const sourceFile = parse(source);
      const result = enableImportInjectionDefaultRule.transform(sourceFile, []);
      expect(result).toBe(source);
    });
  });
});
