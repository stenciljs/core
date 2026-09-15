import ts from 'typescript';
import { describe, it, expect } from 'vitest';

import { globalStyleInjectRule } from '../rules/global-style-inject';

describe('global-style-inject migration', () => {
  describe('detect', () => {
    it('should detect addGlobalStyleToComponents: true', () => {
      const source = `
export const config: Config = {
  extras: {
    addGlobalStyleToComponents: true,
  },
};
`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain('addGlobalStyleToComponents');
      expect(matches[0].message).toContain('removed');
      expect(matches[0].message).toContain('inject');
    });

    it('should detect addGlobalStyleToComponents: false', () => {
      const source = `
export const config: Config = {
  extras: {
    addGlobalStyleToComponents: false,
  },
};
`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain('addGlobalStyleToComponents');
    });

    it("should detect addGlobalStyleToComponents: 'client'", () => {
      const source = `
export const config: Config = {
  extras: {
    addGlobalStyleToComponents: 'client',
  },
};
`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain('addGlobalStyleToComponents');
    });

    it('should not detect addGlobalStyleToComponents outside of extras', () => {
      const source = `
export const config: Config = {
  addGlobalStyleToComponents: true,
};
`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);

      expect(matches).toHaveLength(0);
    });

    it('should not detect when extras does not contain addGlobalStyleToComponents', () => {
      const source = `
export const config: Config = {
  extras: {
    someOtherOption: true,
  },
};
`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);

      expect(matches).toHaveLength(0);
    });

    it('should detect with other extras options present', () => {
      const source = `
export const config: Config = {
  extras: {
    enableImportInjection: true,
    addGlobalStyleToComponents: true,
    experimentalSlotFixes: true,
  },
};
`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain('addGlobalStyleToComponents');
    });
  });

  describe('transform', () => {
    it('should remove addGlobalStyleToComponents: true and add global-style with inject: all', () => {
      const source = `export const config: Config = {
  outputTargets: [
    { type: 'www' },
  ],
  extras: {
    addGlobalStyleToComponents: true,
  },
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);
      const result = globalStyleInjectRule.transform(sourceFile, matches);

      expect(result).not.toContain('addGlobalStyleToComponents');
      expect(result).toContain("type: 'global-style'");
      expect(result).toContain("inject: 'all'");
    });

    it("should remove addGlobalStyleToComponents: 'client' and add global-style with inject: client", () => {
      const source = `export const config: Config = {
  outputTargets: [
    { type: 'www' },
  ],
  extras: {
    addGlobalStyleToComponents: 'client',
  },
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);
      const result = globalStyleInjectRule.transform(sourceFile, matches);

      expect(result).not.toContain('addGlobalStyleToComponents');
      expect(result).toContain("type: 'global-style'");
      expect(result).toContain("inject: 'client'");
    });

    it('should remove addGlobalStyleToComponents: false without adding global-style output target', () => {
      const source = `export const config: Config = {
  outputTargets: [
    { type: 'www' },
  ],
  extras: {
    addGlobalStyleToComponents: false,
  },
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);
      const result = globalStyleInjectRule.transform(sourceFile, matches);

      expect(result).not.toContain('addGlobalStyleToComponents');
      expect(result).not.toContain("type: 'global-style'");
    });

    it('should clean up empty extras object after removal', () => {
      const source = `export const config: Config = {
  outputTargets: [
    { type: 'www' },
  ],
  extras: {
    addGlobalStyleToComponents: false,
  },
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);
      const result = globalStyleInjectRule.transform(sourceFile, matches);

      expect(result).not.toContain('extras');
    });

    it('should preserve other extras options after removal', () => {
      const source = `export const config: Config = {
  outputTargets: [
    { type: 'www' },
  ],
  extras: {
    enableImportInjection: true,
    addGlobalStyleToComponents: true,
  },
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);
      const result = globalStyleInjectRule.transform(sourceFile, matches);

      expect(result).not.toContain('addGlobalStyleToComponents');
      expect(result).toContain('extras');
      expect(result).toContain('enableImportInjection: true');
      expect(result).toContain("type: 'global-style'");
      expect(result).toContain("inject: 'all'");
    });

    it('should not add global-style if one already exists', () => {
      const source = `export const config: Config = {
  outputTargets: [
    { type: 'www' },
    { type: 'global-style', fileName: 'custom.css' },
  ],
  extras: {
    addGlobalStyleToComponents: true,
  },
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);
      const result = globalStyleInjectRule.transform(sourceFile, matches);

      expect(result).not.toContain('addGlobalStyleToComponents');
      // Should only have one global-style, not add another
      const globalStyleCount = (result.match(/type: 'global-style'/g) || []).length;
      expect(globalStyleCount).toBe(1);
    });

    it('should handle config with no outputTargets array', () => {
      const source = `export const config: Config = {
  extras: {
    addGlobalStyleToComponents: true,
  },
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);
      const result = globalStyleInjectRule.transform(sourceFile, matches);

      // Should remove the property but not crash when there's no outputTargets
      expect(result).not.toContain('addGlobalStyleToComponents');
    });

    it('should handle trailing comma after addGlobalStyleToComponents', () => {
      const source = `export const config: Config = {
  outputTargets: [
    { type: 'www' },
  ],
  extras: {
    addGlobalStyleToComponents: true,
    enableImportInjection: true,
  },
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);
      const result = globalStyleInjectRule.transform(sourceFile, matches);

      expect(result).not.toContain('addGlobalStyleToComponents');
      expect(result).toContain('enableImportInjection: true');
      // Ensure no syntax errors (double commas, etc.)
      expect(result).not.toMatch(/,\s*,/);
    });

    it('should handle addGlobalStyleToComponents as last property with leading comma', () => {
      const source = `export const config: Config = {
  outputTargets: [
    { type: 'www' },
  ],
  extras: {
    enableImportInjection: true,
    addGlobalStyleToComponents: true
  },
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);
      const result = globalStyleInjectRule.transform(sourceFile, matches);

      expect(result).not.toContain('addGlobalStyleToComponents');
      expect(result).toContain('enableImportInjection: true');
    });

    it('should return source unchanged when no matches', () => {
      const source = `export const config: Config = {
  outputTargets: [
    { type: 'www' },
  ],
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);
      const result = globalStyleInjectRule.transform(sourceFile, matches);

      expect(result).toBe(source);
    });

    it('should add global-style output target to empty outputTargets array', () => {
      const source = `export const config: Config = {
  outputTargets: [],
  extras: {
    addGlobalStyleToComponents: true,
  },
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = globalStyleInjectRule.detect(sourceFile);
      const result = globalStyleInjectRule.transform(sourceFile, matches);

      expect(result).not.toContain('addGlobalStyleToComponents');
      expect(result).toContain("type: 'global-style'");
      expect(result).toContain("inject: 'all'");
    });
  });
});
