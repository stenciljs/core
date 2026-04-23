import ts from 'typescript';
import { describe, it, expect } from 'vitest';

import { outputTargetRenamesRule } from '../rules/output-target-renames';

describe('output-target-renames migration', () => {
  describe('detect', () => {
    it('should detect old output target type names', () => {
      const source = `
export const config: Config = {
  outputTargets: [
    { type: 'dist' },
    { type: 'dist-custom-elements' },
    { type: 'dist-hydrate-script' },
    { type: 'dist-collection' },
  ],
};
`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);

      expect(matches).toHaveLength(4);
      expect(matches[0].message).toContain("'dist' → 'loader-bundle'");
      expect(matches[1].message).toContain("'dist-custom-elements' → 'standalone'");
      expect(matches[2].message).toContain("'dist-hydrate-script' → 'ssr'");
      expect(matches[3].message).toContain("'dist-collection' → 'stencil-rebundle'");
    });

    it('should detect collectionDir property', () => {
      const source = `
export const config: Config = {
  outputTargets: [
    {
      type: 'dist',
      collectionDir: 'my-collection',
    },
  ],
};
`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);

      expect(matches.length).toBeGreaterThan(0);
      const collectionMatch = matches.find((m) => m.message.includes('collectionDir'));
      expect(collectionMatch).toBeDefined();
      expect(collectionMatch?.message).toContain("'stencil-rebundle'");
    });

    it('should detect typesDir property', () => {
      const source = `
export const config: Config = {
  outputTargets: [
    {
      type: 'dist',
      typesDir: 'my-types',
    },
  ],
};
`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);

      expect(matches.length).toBeGreaterThan(0);
      const typesMatch = matches.find((m) => m.message.includes('typesDir'));
      expect(typesMatch).toBeDefined();
      expect(typesMatch?.message).toContain("'types'");
    });

    it('should not detect new output target names', () => {
      const source = `
export const config: Config = {
  outputTargets: [
    { type: 'loader-bundle' },
    { type: 'standalone' },
    { type: 'ssr' },
    { type: 'stencil-rebundle' },
  ],
};
`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);

      expect(matches).toHaveLength(0);
    });

    it('should detect isPrimaryPackageOutputTarget property', () => {
      const source = `
export const config: Config = {
  outputTargets: [
    {
      type: 'dist-custom-elements',
      isPrimaryPackageOutputTarget: true,
    },
  ],
};
`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);

      const primaryMatch = matches.find((m) => m.message.includes('isPrimaryPackageOutputTarget'));
      expect(primaryMatch).toBeDefined();
      expect(primaryMatch?.message).toContain('removed in v5');
      expect(primaryMatch?.message).toContain('auto-detects');
    });

    it('should detect generateTypeDeclarations property', () => {
      const source = `
export const config: Config = {
  outputTargets: [
    {
      type: 'dist-custom-elements',
      generateTypeDeclarations: true,
    },
  ],
};
`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);

      const typeDecsMatch = matches.find((m) => m.message.includes('generateTypeDeclarations'));
      expect(typeDecsMatch).toBeDefined();
      expect(typeDecsMatch?.message).toContain('removed in v5');
      expect(typeDecsMatch?.message).toContain('types');
    });
  });

  describe('transform', () => {
    it('should rename dist to loader-bundle', () => {
      const source = `export const config: Config = {
  outputTargets: [
    { type: 'dist', dir: 'my-dist' },
  ],
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);
      const result = outputTargetRenamesRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'loader-bundle'");
      expect(result).not.toContain("type: 'dist'");
    });

    it('should rename dist-custom-elements to standalone', () => {
      const source = `export const config: Config = {
  outputTargets: [
    { type: 'dist-custom-elements' },
  ],
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);
      const result = outputTargetRenamesRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'standalone'");
      expect(result).not.toContain("type: 'dist-custom-elements'");
    });

    it('should rename dist-hydrate-script to ssr', () => {
      const source = `export const config: Config = {
  outputTargets: [
    { type: 'dist-hydrate-script' },
  ],
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);
      const result = outputTargetRenamesRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'ssr'");
      expect(result).not.toContain("type: 'dist-hydrate-script'");
    });

    it('should rename multiple output targets', () => {
      const source = `export const config: Config = {
  outputTargets: [
    { type: 'dist' },
    { type: 'dist-custom-elements' },
    { type: 'dist-hydrate-script' },
  ],
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);
      const result = outputTargetRenamesRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'loader-bundle'");
      expect(result).toContain("type: 'standalone'");
      expect(result).toContain("type: 'ssr'");
      expect(result).not.toContain("type: 'dist'");
      expect(result).not.toContain("type: 'dist-custom-elements'");
      expect(result).not.toContain("type: 'dist-hydrate-script'");
    });

    it('should extract collectionDir to separate output target', () => {
      const source = `export const config: Config = {
  outputTargets: [
    {
      type: 'dist',
      collectionDir: 'my-collection',
      dir: 'my-dist',
    },
  ],
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);
      const result = outputTargetRenamesRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'loader-bundle'");
      expect(result).not.toContain('collectionDir');
      expect(result).toContain("type: 'stencil-rebundle'");
      expect(result).toContain("dir: 'my-collection'");
    });

    it('should extract typesDir to separate output target', () => {
      const source = `export const config: Config = {
  outputTargets: [
    {
      type: 'dist',
      typesDir: 'my-types',
      dir: 'my-dist',
    },
  ],
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);
      const result = outputTargetRenamesRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'loader-bundle'");
      expect(result).not.toContain('typesDir');
      expect(result).toContain("type: 'types'");
      expect(result).toContain("dir: 'my-types'");
    });

    it('should extract both collectionDir and typesDir', () => {
      const source = `export const config: Config = {
  outputTargets: [
    {
      type: 'dist',
      collectionDir: 'my-collection',
      typesDir: 'my-types',
      dir: 'my-dist',
    },
  ],
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);
      const result = outputTargetRenamesRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'loader-bundle'");
      expect(result).not.toContain('collectionDir');
      expect(result).not.toContain('typesDir');
      expect(result).toContain("type: 'stencil-rebundle'");
      expect(result).toContain("type: 'types'");
    });

    it('should preserve other properties in output target', () => {
      const source = `export const config: Config = {
  outputTargets: [
    {
      type: 'dist',
      dir: 'my-dist',
      buildDir: 'build',
      empty: false,
    },
  ],
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);
      const result = outputTargetRenamesRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'loader-bundle'");
      expect(result).toContain("dir: 'my-dist'");
      expect(result).toContain("buildDir: 'build'");
      expect(result).toContain('empty: false');
    });

    it('should handle complex real-world config', () => {
      const source = `export const config: Config = {
  namespace: 'my-lib',
  outputTargets: [
    {
      type: 'dist',
      dir: 'dist',
      collectionDir: 'collection',
      typesDir: 'types',
    },
    {
      type: 'dist-custom-elements',
      dir: 'dist/components',
    },
    {
      type: 'dist-hydrate-script',
      dir: 'dist/hydrate',
    },
  ],
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);
      const result = outputTargetRenamesRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'loader-bundle'");
      expect(result).toContain("type: 'standalone'");
      expect(result).toContain("type: 'ssr'");
      expect(result).toContain("type: 'stencil-rebundle'");
      expect(result).toContain("type: 'types'");
      expect(result).not.toContain('collectionDir');
      expect(result).not.toContain('typesDir');
      expect(result).not.toContain("type: 'dist'");
      expect(result).not.toContain("type: 'dist-custom-elements'");
      expect(result).not.toContain("type: 'dist-hydrate-script'");
    });

    it('should remove isPrimaryPackageOutputTarget property', () => {
      const source = `export const config: Config = {
  outputTargets: [
    {
      type: 'dist-custom-elements',
      isPrimaryPackageOutputTarget: true,
      dir: 'dist/components',
    },
  ],
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);
      const result = outputTargetRenamesRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'standalone'");
      expect(result).toContain("dir: 'dist/components'");
      expect(result).not.toContain('isPrimaryPackageOutputTarget');
    });

    it('should remove generateTypeDeclarations property', () => {
      const source = `export const config: Config = {
  outputTargets: [
    {
      type: 'dist-custom-elements',
      generateTypeDeclarations: true,
      dir: 'dist/components',
    },
  ],
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);
      const result = outputTargetRenamesRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'standalone'");
      expect(result).toContain("dir: 'dist/components'");
      expect(result).not.toContain('generateTypeDeclarations');
    });

    it('should remove both isPrimaryPackageOutputTarget and generateTypeDeclarations', () => {
      const source = `export const config: Config = {
  outputTargets: [
    {
      type: 'dist-custom-elements',
      isPrimaryPackageOutputTarget: true,
      generateTypeDeclarations: false,
      dir: 'dist/components',
    },
  ],
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);
      const result = outputTargetRenamesRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'standalone'");
      expect(result).toContain("dir: 'dist/components'");
      expect(result).not.toContain('isPrimaryPackageOutputTarget');
      expect(result).not.toContain('generateTypeDeclarations');
    });

    it('should handle complex config with all removed properties', () => {
      const source = `export const config: Config = {
  namespace: 'my-lib',
  outputTargets: [
    {
      type: 'dist',
      dir: 'dist',
      collectionDir: 'collection',
      typesDir: 'types',
    },
    {
      type: 'dist-custom-elements',
      dir: 'dist/components',
      isPrimaryPackageOutputTarget: true,
      generateTypeDeclarations: true,
    },
  ],
};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      const matches = outputTargetRenamesRule.detect(sourceFile);
      const result = outputTargetRenamesRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'loader-bundle'");
      expect(result).toContain("type: 'standalone'");
      expect(result).toContain("type: 'stencil-rebundle'");
      expect(result).toContain("type: 'types'");
      expect(result).not.toContain('collectionDir');
      expect(result).not.toContain('typesDir');
      expect(result).not.toContain('isPrimaryPackageOutputTarget');
      expect(result).not.toContain('generateTypeDeclarations');
    });
  });
});
