import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { getRulesForVersionUpgrade, getStencilCoreImportMap, isStencilDecorator } from '../index';

/**
 * Helper to create a TypeScript source file from code string
 */
function createSourceFile(code: string): ts.SourceFile {
  return ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true);
}

describe('migrations/index', () => {
  describe('getStencilCoreImportMap', () => {
    it('should return empty map when no @stencil/core import', () => {
      const code = `
        import { something } from 'other-library';
      `;
      const sourceFile = createSourceFile(code);
      const importMap = getStencilCoreImportMap(sourceFile);

      expect(importMap.size).toBe(0);
    });

    it('should map non-aliased imports to themselves', () => {
      const code = `
        import { Component, h, Prop } from '@stencil/core';
      `;
      const sourceFile = createSourceFile(code);
      const importMap = getStencilCoreImportMap(sourceFile);

      expect(importMap.get('Component')).toBe('Component');
      expect(importMap.get('h')).toBe('h');
      expect(importMap.get('Prop')).toBe('Prop');
    });

    it('should map aliased imports to original names', () => {
      const code = `
        import { Component as Cmp, Prop as Input } from '@stencil/core';
      `;
      const sourceFile = createSourceFile(code);
      const importMap = getStencilCoreImportMap(sourceFile);

      expect(importMap.get('Cmp')).toBe('Component');
      expect(importMap.get('Input')).toBe('Prop');
      // Original names should not be in the map
      expect(importMap.has('Component')).toBe(false);
      expect(importMap.has('Prop')).toBe(false);
    });

    it('should handle mixed aliased and non-aliased imports', () => {
      const code = `
        import { Component as Cmp, h, Prop as Input, State } from '@stencil/core';
      `;
      const sourceFile = createSourceFile(code);
      const importMap = getStencilCoreImportMap(sourceFile);

      expect(importMap.get('Cmp')).toBe('Component');
      expect(importMap.get('h')).toBe('h');
      expect(importMap.get('Input')).toBe('Prop');
      expect(importMap.get('State')).toBe('State');
    });
  });

  describe('isStencilDecorator', () => {
    it('should return true for non-aliased decorator', () => {
      const importMap = new Map([['Component', 'Component']]);
      expect(isStencilDecorator('Component', 'Component', importMap)).toBe(true);
    });

    it('should return true for aliased decorator', () => {
      const importMap = new Map([['Cmp', 'Component']]);
      expect(isStencilDecorator('Cmp', 'Component', importMap)).toBe(true);
    });

    it('should return false for non-matching decorator', () => {
      const importMap = new Map([['Component', 'Component']]);
      expect(isStencilDecorator('SomeOther', 'Component', importMap)).toBe(false);
    });

    it('should return false for empty import map', () => {
      const importMap = new Map<string, string>();
      expect(isStencilDecorator('Component', 'Component', importMap)).toBe(false);
    });
  });

  describe('getRulesForVersionUpgrade', () => {
    it('should return rules for 4.x to 5.x upgrade', () => {
      const rules = getRulesForVersionUpgrade('4', '5');

      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r) => r.fromVersion.startsWith('4'))).toBe(true);
      expect(rules.every((r) => r.toVersion.startsWith('5'))).toBe(true);
    });

    it('should include encapsulation-api rule for v4 to v5', () => {
      const rules = getRulesForVersionUpgrade('4', '5');
      const encapsulationRule = rules.find((r) => r.id === 'encapsulation-api');

      expect(encapsulationRule).toBeDefined();
      expect(encapsulationRule!.name).toBe('Encapsulation API');
    });

    it('should include form-associated rule for v4 to v5', () => {
      const rules = getRulesForVersionUpgrade('4', '5');
      const formAssociatedRule = rules.find((r) => r.id === 'form-associated');

      expect(formAssociatedRule).toBeDefined();
      expect(formAssociatedRule!.name).toBe('Form Associated');
    });

    it('should return empty array for non-existent version upgrade', () => {
      const rules = getRulesForVersionUpgrade('99', '100');

      expect(rules).toEqual([]);
    });

    it('should return empty array for downgrade', () => {
      const rules = getRulesForVersionUpgrade('5', '4');

      expect(rules).toEqual([]);
    });

    it('should handle partial version matching', () => {
      // Rules have fromVersion: '4.x', toVersion: '5.x'
      // Should match when we pass just '4' and '5'
      const rules = getRulesForVersionUpgrade('4', '5');

      expect(rules.length).toBeGreaterThan(0);
    });
  });
});
