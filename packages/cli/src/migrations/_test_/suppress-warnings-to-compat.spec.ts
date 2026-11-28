import ts from 'typescript';
import { describe, it, expect } from 'vitest';

import { suppressWarningsToCompatRule } from '../rules/suppress-warnings-to-compat';

const parse = (source: string) =>
  ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);

describe('suppress-warnings-to-compat migration', () => {
  describe('detect', () => {
    it('detects both flags', () => {
      const source = `export const config: Config = {
  suppressReservedPublicNameWarnings: true,
  suppressReservedEventNameWarnings: false,
};`;
      const matches = suppressWarningsToCompatRule.detect(parse(source));
      expect(matches).toHaveLength(2);
      expect(matches[0].message).toContain(
        "'suppressReservedPublicNameWarnings' has moved to 'compat.suppressPublicNameWarnings'",
      );
      expect(matches[1].message).toContain(
        "'suppressReservedEventNameWarnings' has moved to 'compat.suppressEventNameWarnings'",
      );
    });

    it('returns no matches when neither flag is present', () => {
      const source = `export const config: Config = {
  namespace: 'MyApp',
};`;
      expect(suppressWarningsToCompatRule.detect(parse(source))).toHaveLength(0);
    });
  });

  describe('transform', () => {
    it('moves a single flag into a new compat object', () => {
      const source = `export const config: Config = {
  namespace: 'MyApp',
  suppressReservedPublicNameWarnings: true,
};`;
      const sourceFile = parse(source);
      const matches = suppressWarningsToCompatRule.detect(sourceFile);
      const result = suppressWarningsToCompatRule.transform(sourceFile, matches);

      expect(result).not.toContain('suppressReservedPublicNameWarnings');
      expect(result).toContain("namespace: 'MyApp'");
      expect(result).toContain('compat: { suppressPublicNameWarnings: true }');
    });

    it('moves both flags into a new compat object', () => {
      const source = `export const config: Config = {
  suppressReservedPublicNameWarnings: true,
  suppressReservedEventNameWarnings: false,
};`;
      const sourceFile = parse(source);
      const matches = suppressWarningsToCompatRule.detect(sourceFile);
      const result = suppressWarningsToCompatRule.transform(sourceFile, matches);

      expect(result).not.toContain('suppressReservedPublicNameWarnings');
      expect(result).not.toContain('suppressReservedEventNameWarnings');
      expect(result).toContain(
        'compat: { suppressPublicNameWarnings: true, suppressEventNameWarnings: false }',
      );
      expect(ts.createSourceFile('out.ts', result, ts.ScriptTarget.Latest, true)).toBeTruthy();
    });

    it('merges into an existing empty compat object', () => {
      const source = `export const config: Config = {
  compat: {},
  suppressReservedPublicNameWarnings: true,
};`;
      const sourceFile = parse(source);
      const matches = suppressWarningsToCompatRule.detect(sourceFile);
      const result = suppressWarningsToCompatRule.transform(sourceFile, matches);

      expect(result).not.toContain('suppressReservedPublicNameWarnings');
      expect(result).toContain('compat: { suppressPublicNameWarnings: true }');
    });

    it('merges into an existing non-empty compat object', () => {
      const source = `export const config: Config = {
  compat: { lightDomPatches: false },
  suppressReservedEventNameWarnings: true,
};`;
      const sourceFile = parse(source);
      const matches = suppressWarningsToCompatRule.detect(sourceFile);
      const result = suppressWarningsToCompatRule.transform(sourceFile, matches);

      expect(result).not.toContain('suppressReservedEventNameWarnings');
      expect(result).toContain('lightDomPatches: false');
      expect(result).toContain('suppressEventNameWarnings: true');
      expect(result).toMatch(
        /compat:\s*{\s*lightDomPatches: false, suppressEventNameWarnings: true\s*}/,
      );
    });

    it('returns unchanged source when no matches', () => {
      const source = `export const config: Config = { namespace: 'App' };`;
      const sourceFile = parse(source);
      const result = suppressWarningsToCompatRule.transform(sourceFile, []);
      expect(result).toBe(source);
    });
  });
});
