import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { cssImportQueryParamRule } from '../rules/css-import-query-param';

function createSourceFile(code: string): ts.SourceFile {
  return ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true);
}

describe('css-import-query-param migration rule', () => {
  describe('metadata', () => {
    it('should have correct rule metadata', () => {
      expect(cssImportQueryParamRule.id).toBe('css-import-query-param');
      expect(cssImportQueryParamRule.fromVersion).toBe('4.x');
      expect(cssImportQueryParamRule.toVersion).toBe('5.x');
    });
  });

  describe('detect', () => {
    it('should detect a raw css import', () => {
      const code = `import styles from './my-component.css';`;
      const sourceFile = createSourceFile(code);
      const matches = cssImportQueryParamRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain('./my-component.css');
    });

    it.each(['./logo.svg', './my-text.txt', './shader.frag', './shader.vert'])(
      'should detect a raw %s import',
      (specifier) => {
        const code = `import asset from '${specifier}';`;
        const sourceFile = createSourceFile(code);
        const matches = cssImportQueryParamRule.detect(sourceFile);

        expect(matches).toHaveLength(1);
      },
    );

    it('should detect a side-effect only css import', () => {
      const code = `import './global.css';`;
      const sourceFile = createSourceFile(code);
      const matches = cssImportQueryParamRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
    });

    it('should detect a re-export css specifier', () => {
      const code = `export { default } from './my-component.css';`;
      const sourceFile = createSourceFile(code);
      const matches = cssImportQueryParamRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
    });

    it('should detect a dynamic import()', () => {
      const code = `const styles = await import('./my-component.css');`;
      const sourceFile = createSourceFile(code);
      const matches = cssImportQueryParamRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
    });

    it('should not detect imports that already have a query param', () => {
      const code = `import styles from './my-component.css?stencil';`;
      const sourceFile = createSourceFile(code);
      const matches = cssImportQueryParamRule.detect(sourceFile);

      expect(matches).toHaveLength(0);
    });

    it('should not detect other ?format= asset imports', () => {
      const code = `import text from './my-text.txt?format=text';`;
      const sourceFile = createSourceFile(code);
      const matches = cssImportQueryParamRule.detect(sourceFile);

      expect(matches).toHaveLength(0);
    });

    it('should not detect non-asset imports', () => {
      const code = `import { Component } from '@stencil/core';`;
      const sourceFile = createSourceFile(code);
      const matches = cssImportQueryParamRule.detect(sourceFile);

      expect(matches).toHaveLength(0);
    });

    it('should not touch styleUrl values in @Component options', () => {
      const code = `
        import { Component } from '@stencil/core';
        @Component({
          tag: 'my-component',
          styleUrl: 'my-component.css'
        })
        export class MyComponent {}
      `;
      const sourceFile = createSourceFile(code);
      const matches = cssImportQueryParamRule.detect(sourceFile);

      expect(matches).toHaveLength(0);
    });

    it('should detect multiple raw asset imports', () => {
      const code = `
        import styles from './my-component.css';
        import ios from './my-component.ios.css';
        import logo from './logo.svg';
      `;
      const sourceFile = createSourceFile(code);
      const matches = cssImportQueryParamRule.detect(sourceFile);

      expect(matches).toHaveLength(3);
    });
  });

  describe('transform', () => {
    it('should append ?stencil to a raw css import', () => {
      const code = `import styles from './my-component.css';`;
      const sourceFile = createSourceFile(code);
      const matches = cssImportQueryParamRule.detect(sourceFile);
      const result = cssImportQueryParamRule.transform(sourceFile, matches);

      expect(result).toBe(`import styles from './my-component.css?stencil';`);
    });

    it('should preserve double quotes', () => {
      const code = `import styles from "./my-component.css";`;
      const sourceFile = createSourceFile(code);
      const matches = cssImportQueryParamRule.detect(sourceFile);
      const result = cssImportQueryParamRule.transform(sourceFile, matches);

      expect(result).toBe(`import styles from "./my-component.css?stencil";`);
    });

    it('should transform multiple imports without corrupting positions', () => {
      const code = `import styles from './my-component.css';
import ios from './my-component.ios.css';
import logo from './logo.svg';`;
      const sourceFile = createSourceFile(code);
      const matches = cssImportQueryParamRule.detect(sourceFile);
      const result = cssImportQueryParamRule.transform(sourceFile, matches);

      expect(result).toBe(`import styles from './my-component.css?stencil';
import ios from './my-component.ios.css?stencil';
import logo from './logo.svg?stencil';`);
    });

    it('should preserve unrelated code around the import', () => {
      const code = `import { Component } from '@stencil/core';
import styles from './my-component.css';

@Component({
  tag: 'my-component',
  styles,
  styleUrl: 'other.css'
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = cssImportQueryParamRule.detect(sourceFile);
      const result = cssImportQueryParamRule.transform(sourceFile, matches);

      expect(result).toContain(`import styles from './my-component.css?stencil';`);
      expect(result).toContain(`styleUrl: 'other.css'`);
    });

    it('should return original text when no matches', () => {
      const code = `import { Component } from '@stencil/core';`;
      const sourceFile = createSourceFile(code);
      const result = cssImportQueryParamRule.transform(sourceFile, []);

      expect(result).toBe(code);
    });
  });
});
