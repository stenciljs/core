import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { getRulesForVersionUpgrade, getStencilCoreImportMap, isStencilDecorator } from '../index';
import { buildDistDocsRule } from '../rules/build-dist-docs';
import { encapsulationApiRule } from '../rules/encapsulation-api';
import { formAssociatedRule } from '../rules/form-associated';
import { outputTargetRenamesRule } from '../rules/output-target-renames';

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

    it('should return encapsulation-api rule before form-associated rule', () => {
      const rules = getRulesForVersionUpgrade('4', '5');
      const encapsulationIndex = rules.findIndex((r) => r.id === 'encapsulation-api');
      const formAssociatedIndex = rules.findIndex((r) => r.id === 'form-associated');

      expect(encapsulationIndex).toBeGreaterThanOrEqual(0);
      expect(formAssociatedIndex).toBeGreaterThanOrEqual(0);
      expect(encapsulationIndex).toBeLessThan(formAssociatedIndex);
    });
  });

  describe('rule interaction: encapsulation-api + form-associated', () => {
    /**
     * These tests verify that when multiple migration rules act on the same
     * @Component decorator, they work correctly in sequence. This simulates
     * how task-migrate.ts applies rules: detect → transform → re-parse → next rule.
     */

    it('should correctly migrate component with both shadow and formAssociated', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-form',
  shadow: true,
  formAssociated: true
})
export class MyForm {}`;

      // Step 1: Apply encapsulation-api rule first
      let sourceFile = createSourceFile(code);
      let matches = encapsulationApiRule.detect(sourceFile);
      expect(matches).toHaveLength(1);

      let result = encapsulationApiRule.transform(sourceFile, matches);
      expect(result).toContain("encapsulation: { type: 'shadow' }");
      expect(result).not.toContain('shadow: true');
      // formAssociated should still be there
      expect(result).toContain('formAssociated: true');

      // Step 2: Re-parse and apply form-associated rule
      sourceFile = createSourceFile(result);
      matches = formAssociatedRule.detect(sourceFile);
      expect(matches).toHaveLength(1);

      result = formAssociatedRule.transform(sourceFile, matches);
      expect(result).toContain("encapsulation: { type: 'shadow' }");
      expect(result).toContain('@AttachInternals()');
      expect(result).toContain('internals: ElementInternals');
      expect(result).not.toContain('formAssociated');

      // Verify the result is valid TypeScript
      const finalSourceFile = createSourceFile(result);
      expect(finalSourceFile.statements.length).toBeGreaterThan(0);
    });

    it('should handle shadow with delegatesFocus and formAssociated', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-form',
  shadow: { delegatesFocus: true },
  formAssociated: true
})
export class MyForm {}`;

      // Apply encapsulation-api rule
      let sourceFile = createSourceFile(code);
      let matches = encapsulationApiRule.detect(sourceFile);
      let result = encapsulationApiRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'shadow'");
      expect(result).toContain('delegatesFocus: true');

      // Apply form-associated rule
      sourceFile = createSourceFile(result);
      matches = formAssociatedRule.detect(sourceFile);
      result = formAssociatedRule.transform(sourceFile, matches);

      expect(result).toContain('@AttachInternals()');
      expect(result).not.toContain('formAssociated');
      // Encapsulation should be preserved
      expect(result).toContain("type: 'shadow'");
      expect(result).toContain('delegatesFocus: true');
    });

    it('should handle scoped and formAssociated', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-form',
  scoped: true,
  formAssociated: true
})
export class MyForm {}`;

      // Apply encapsulation-api rule
      let sourceFile = createSourceFile(code);
      let matches = encapsulationApiRule.detect(sourceFile);
      let result = encapsulationApiRule.transform(sourceFile, matches);

      expect(result).toContain("encapsulation: { type: 'scoped' }");
      expect(result).not.toContain('scoped: true');

      // Apply form-associated rule
      sourceFile = createSourceFile(result);
      matches = formAssociatedRule.detect(sourceFile);
      result = formAssociatedRule.transform(sourceFile, matches);

      expect(result).toContain('@AttachInternals()');
      expect(result).not.toContain('formAssociated');
      expect(result).toContain("encapsulation: { type: 'scoped' }");
    });

    it('should handle multiple components with different combinations', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'cmp-a',
  shadow: true
})
export class CmpA {}

@Component({
  tag: 'cmp-b',
  formAssociated: true
})
export class CmpB {}

@Component({
  tag: 'cmp-c',
  shadow: true,
  formAssociated: true
})
export class CmpC {}`;

      // Apply encapsulation-api rule (should find 2 matches: cmp-a and cmp-c)
      let sourceFile = createSourceFile(code);
      let matches = encapsulationApiRule.detect(sourceFile);
      expect(matches).toHaveLength(2);

      let result = encapsulationApiRule.transform(sourceFile, matches);

      // Apply form-associated rule (should find 2 matches: cmp-b and cmp-c)
      sourceFile = createSourceFile(result);
      matches = formAssociatedRule.detect(sourceFile);
      expect(matches).toHaveLength(2);

      result = formAssociatedRule.transform(sourceFile, matches);

      // Verify all transformations are correct
      // CmpA: only shadow → encapsulation
      // CmpB: only formAssociated → @AttachInternals
      // CmpC: both shadow and formAssociated → both transformations
      expect(result).not.toContain('shadow: true');
      expect(result).not.toContain('formAssociated');
      expect((result.match(/encapsulation:/g) || []).length).toBe(2); // CmpA and CmpC
      expect((result.match(/@AttachInternals\(\)/g) || []).length).toBe(2); // CmpB and CmpC
    });

    it('should preserve component options order and formatting', () => {
      const code = `import { Component, h } from '@stencil/core';
@Component({
  tag: 'my-form',
  styleUrl: 'my-form.css',
  shadow: true,
  formAssociated: true,
  assetsDirs: ['assets']
})
export class MyForm {
  render() {
    return <div>Hello</div>;
  }
}`;

      // Apply both rules sequentially
      let sourceFile = createSourceFile(code);
      let matches = encapsulationApiRule.detect(sourceFile);
      let result = encapsulationApiRule.transform(sourceFile, matches);

      sourceFile = createSourceFile(result);
      matches = formAssociatedRule.detect(sourceFile);
      result = formAssociatedRule.transform(sourceFile, matches);

      // All original options should be preserved
      expect(result).toContain("tag: 'my-form'");
      expect(result).toContain("styleUrl: 'my-form.css'");
      expect(result).toContain("assetsDirs: ['assets']");
      expect(result).toContain("encapsulation: { type: 'shadow' }");
      expect(result).toContain('@AttachInternals()');
      expect(result).toContain('render()');
    });
  });

  describe('rule interaction: build-dist-docs + output-target-renames', () => {
    /**
     * These tests verify that when both rules act on the same stencil.config.ts file,
     * they work correctly in sequence. The order is critical:
     * - build-dist-docs runs FIRST (looks for 'dist', 'dist-custom-elements', etc.)
     * - output-target-renames runs SECOND (renames 'dist' → 'loader-bundle', etc.)
     */

    it('should return build-dist-docs rule before output-target-renames rule', () => {
      const rules = getRulesForVersionUpgrade('4', '5');
      const buildDistDocsIndex = rules.findIndex((r) => r.id === 'build-dist-docs');
      const outputTargetRenamesIndex = rules.findIndex((r) => r.id === 'output-target-renames');

      expect(buildDistDocsIndex).toBeGreaterThanOrEqual(0);
      expect(outputTargetRenamesIndex).toBeGreaterThanOrEqual(0);
      expect(buildDistDocsIndex).toBeLessThan(outputTargetRenamesIndex);
    });

    it('should add skipInDev to dist targets then rename them', () => {
      const code = `export const config = {
  buildDist: true,
  outputTargets: [
    { type: 'dist', dir: 'dist' },
    { type: 'dist-custom-elements', dir: 'components' },
  ],
};`;

      // Step 1: Apply build-dist-docs rule first
      let sourceFile = createSourceFile(code);
      let matches = buildDistDocsRule.detect(sourceFile);
      expect(matches).toHaveLength(1); // buildDist: true

      let result = buildDistDocsRule.transform(sourceFile, matches);
      expect(result).not.toContain('buildDist');
      expect(result).toContain('skipInDev: false'); // Added to dist targets
      // Types should still be old names at this point
      expect(result).toContain("type: 'dist'");
      expect(result).toContain("type: 'dist-custom-elements'");

      // Step 2: Re-parse and apply output-target-renames rule
      sourceFile = createSourceFile(result);
      matches = outputTargetRenamesRule.detect(sourceFile);
      expect(matches).toHaveLength(2); // dist and dist-custom-elements

      result = outputTargetRenamesRule.transform(sourceFile, matches);
      expect(result).toContain("type: 'loader-bundle'");
      expect(result).toContain("type: 'standalone'");
      expect(result).not.toContain("type: 'dist'");
      expect(result).not.toContain("type: 'dist-custom-elements'");
      // skipInDev should still be there
      expect(result).toContain('skipInDev: false');

      // Verify the result is valid TypeScript
      const finalSourceFile = createSourceFile(result);
      expect(finalSourceFile.statements.length).toBeGreaterThan(0);
    });

    it('should handle buildDist: true with collectionDir and typesDir extraction', () => {
      const code = `export const config = {
  buildDist: true,
  outputTargets: [
    {
      type: 'dist',
      dir: 'dist',
      collectionDir: 'collection',
      typesDir: 'types',
    },
  ],
};`;

      // Apply build-dist-docs rule
      let sourceFile = createSourceFile(code);
      let matches = buildDistDocsRule.detect(sourceFile);
      let result = buildDistDocsRule.transform(sourceFile, matches);

      expect(result).not.toContain('buildDist');
      expect(result).toContain('skipInDev: false');

      // Apply output-target-renames rule
      sourceFile = createSourceFile(result);
      matches = outputTargetRenamesRule.detect(sourceFile);
      result = outputTargetRenamesRule.transform(sourceFile, matches);

      // Should have renamed and extracted
      expect(result).toContain("type: 'loader-bundle'");
      expect(result).toContain("type: 'stencil-meta'");
      expect(result).toContain("type: 'types'");
      expect(result).not.toContain('collectionDir');
      expect(result).not.toContain('typesDir');
      expect(result).toContain('skipInDev: false');
    });

    it('should handle buildDocs: true with docs output targets', () => {
      const code = `export const config = {
  buildDocs: true,
  outputTargets: [
    { type: 'dist' },
    { type: 'docs-readme' },
    { type: 'docs-json', file: 'docs.json' },
  ],
};`;

      // Apply build-dist-docs rule
      let sourceFile = createSourceFile(code);
      let matches = buildDistDocsRule.detect(sourceFile);
      expect(matches).toHaveLength(1); // buildDocs: true

      let result = buildDistDocsRule.transform(sourceFile, matches);
      expect(result).not.toContain('buildDocs');
      // skipInDev should be added to docs targets
      expect((result.match(/skipInDev: false/g) || []).length).toBe(2); // docs-readme and docs-json

      // Apply output-target-renames rule
      sourceFile = createSourceFile(result);
      matches = outputTargetRenamesRule.detect(sourceFile);
      expect(matches).toHaveLength(1); // Only 'dist' gets renamed, docs-* stay the same

      result = outputTargetRenamesRule.transform(sourceFile, matches);
      expect(result).toContain("type: 'loader-bundle'");
      expect(result).toContain("type: 'docs-readme'"); // Not renamed
      expect(result).toContain("type: 'docs-json'"); // Not renamed
    });

    it('should handle complex config with both buildDist and buildDocs', () => {
      const code = `export const config = {
  namespace: 'my-lib',
  buildDist: true,
  buildDocs: true,
  outputTargets: [
    {
      type: 'dist',
      dir: 'dist',
      collectionDir: 'collection',
    },
    {
      type: 'dist-custom-elements',
      isPrimaryPackageOutputTarget: true,
      generateTypeDeclarations: true,
    },
    { type: 'dist-hydrate-script' },
    { type: 'docs-readme' },
  ],
};`;

      // Apply build-dist-docs rule first
      let sourceFile = createSourceFile(code);
      let matches = buildDistDocsRule.detect(sourceFile);
      expect(matches).toHaveLength(2); // buildDist and buildDocs

      let result = buildDistDocsRule.transform(sourceFile, matches);
      expect(result).not.toContain('buildDist');
      expect(result).not.toContain('buildDocs');

      // Apply output-target-renames rule
      sourceFile = createSourceFile(result);
      matches = outputTargetRenamesRule.detect(sourceFile);
      result = outputTargetRenamesRule.transform(sourceFile, matches);

      // All renames should be applied
      expect(result).toContain("type: 'loader-bundle'");
      expect(result).toContain("type: 'standalone'");
      expect(result).toContain("type: 'ssr'");
      expect(result).toContain("type: 'stencil-meta'"); // Extracted from collectionDir
      expect(result).toContain("type: 'docs-readme'"); // Not renamed

      // Removed properties
      expect(result).not.toContain('collectionDir');
      expect(result).not.toContain('isPrimaryPackageOutputTarget');
      expect(result).not.toContain('generateTypeDeclarations');

      // Preserved properties
      expect(result).toContain("namespace: 'my-lib'");
    });

    it('should handle config that already uses new names with buildDist', () => {
      // Edge case: user has partially migrated (new names) but still has buildDist
      const code = `export const config = {
  buildDist: true,
  outputTargets: [
    { type: 'loader-bundle' },
    { type: 'standalone' },
  ],
};`;

      // build-dist-docs recognizes BOTH old and new names
      let sourceFile = createSourceFile(code);
      let matches = buildDistDocsRule.detect(sourceFile);
      expect(matches).toHaveLength(1); // buildDist: true

      let result = buildDistDocsRule.transform(sourceFile, matches);
      expect(result).not.toContain('buildDist');
      // skipInDev should be added to new names too
      expect((result.match(/skipInDev: false/g) || []).length).toBe(2);

      // output-target-renames has nothing to do
      sourceFile = createSourceFile(result);
      matches = outputTargetRenamesRule.detect(sourceFile);
      expect(matches).toHaveLength(0); // Already using new names
    });
  });
});
