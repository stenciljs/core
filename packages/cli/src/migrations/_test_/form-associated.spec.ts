import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { formAssociatedRule } from '../rules/form-associated';

/**
 * Helper to create a TypeScript source file from code string
 */
function createSourceFile(code: string): ts.SourceFile {
  return ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true);
}

describe('form-associated migration rule', () => {
  describe('metadata', () => {
    it('should have correct rule metadata', () => {
      expect(formAssociatedRule.id).toBe('form-associated');
      expect(formAssociatedRule.name).toBe('Form Associated');
      expect(formAssociatedRule.fromVersion).toBe('4.x');
      expect(formAssociatedRule.toVersion).toBe('5.x');
    });
  });

  describe('detect', () => {
    it('should detect formAssociated: true', () => {
      const code = `
        import { Component } from '@stencil/core';
        @Component({
          tag: 'my-component',
          formAssociated: true
        })
        export class MyComponent {}
      `;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain('formAssociated');
    });

    it('should detect formAssociated with shadow', () => {
      const code = `
        import { Component } from '@stencil/core';
        @Component({
          tag: 'my-component',
          shadow: true,
          formAssociated: true
        })
        export class MyComponent {}
      `;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
    });

    it('should not detect when formAssociated is not present', () => {
      const code = `
        import { Component } from '@stencil/core';
        @Component({
          tag: 'my-component',
          shadow: true
        })
        export class MyComponent {}
      `;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);

      expect(matches).toHaveLength(0);
    });

    it('should detect when @AttachInternals already exists', () => {
      const code = `
        import { Component, AttachInternals } from '@stencil/core';
        @Component({
          tag: 'my-component',
          formAssociated: true
        })
        export class MyComponent {
          @AttachInternals() internals: ElementInternals;
        }
      `;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain('already has @AttachInternals');
    });

    it('should provide correct line numbers', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  formAssociated: true
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
      expect(matches[0].line).toBe(4); // formAssociated: true is on line 4
    });

    it('should detect multiple components with formAssociated', () => {
      const code = `
        import { Component } from '@stencil/core';
        @Component({
          tag: 'cmp-a',
          formAssociated: true
        })
        export class CmpA {}

        @Component({
          tag: 'cmp-b',
          formAssociated: true
        })
        export class CmpB {}
      `;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);

      expect(matches).toHaveLength(2);
    });
  });

  describe('transform', () => {
    it('should add @AttachInternals and remove formAssociated', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  formAssociated: true
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);
      const result = formAssociatedRule.transform(sourceFile, matches);

      expect(result).toContain('@AttachInternals()');
      expect(result).toContain('internals: ElementInternals');
      expect(result).not.toContain('formAssociated');
    });

    it('should add AttachInternals to imports', () => {
      const code = `import { Component, h } from '@stencil/core';
@Component({
  tag: 'my-component',
  formAssociated: true
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);
      const result = formAssociatedRule.transform(sourceFile, matches);

      expect(result).toContain('AttachInternals');
      expect(result).toMatch(
        /import\s*\{[^}]*AttachInternals[^}]*\}\s*from\s*['"]@stencil\/core['"]/,
      );
    });

    it('should not duplicate AttachInternals import if already present', () => {
      const code = `import { Component, AttachInternals } from '@stencil/core';
@Component({
  tag: 'my-component',
  formAssociated: true
})
export class MyComponent {
  @AttachInternals() internals: ElementInternals;
}`;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);
      const result = formAssociatedRule.transform(sourceFile, matches);

      // Should only have one AttachInternals in imports
      const importMatches = result.match(/AttachInternals/g);
      // One in import, one in decorator usage
      expect(importMatches!.length).toBe(2);
    });

    it('should only remove formAssociated when @AttachInternals already exists', () => {
      const code = `import { Component, AttachInternals } from '@stencil/core';
@Component({
  tag: 'my-component',
  formAssociated: true
})
export class MyComponent {
  @AttachInternals() internals: ElementInternals;
}`;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);
      const result = formAssociatedRule.transform(sourceFile, matches);

      expect(result).not.toContain('formAssociated');
      // Should still have the existing @AttachInternals
      expect(result).toContain('@AttachInternals()');
    });

    it('should preserve other component options', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  formAssociated: true
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);
      const result = formAssociatedRule.transform(sourceFile, matches);

      expect(result).toContain("tag: 'my-component'");
      expect(result).toContain("styleUrl: 'my-component.css'");
      expect(result).not.toContain('formAssociated');
    });

    it('should handle trailing comma after formAssociated', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  formAssociated: true,
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);
      const result = formAssociatedRule.transform(sourceFile, matches);

      expect(result).not.toContain('formAssociated');
      // Should be valid syntax
      expect(() => createSourceFile(result)).not.toThrow();
    });

    it('should insert @AttachInternals with correct indentation', () => {
      const code = `import { Component, Prop } from '@stencil/core';
@Component({
  tag: 'my-component',
  formAssociated: true
})
export class MyComponent {
  @Prop() value: string;
}`;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);
      const result = formAssociatedRule.transform(sourceFile, matches);

      // Should have @AttachInternals before @Prop
      const attachIndex = result.indexOf('@AttachInternals');
      const propIndex = result.indexOf('@Prop');
      expect(attachIndex).toBeLessThan(propIndex);
    });

    it('should return original text when no matches', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component'
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const result = formAssociatedRule.transform(sourceFile, []);

      expect(result).toBe(code);
    });

    it('should handle component with extends clause', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  formAssociated: true
})
export class MyComponent extends BaseComponent {
}`;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);
      const result = formAssociatedRule.transform(sourceFile, matches);

      expect(result).toContain('@AttachInternals()');
      expect(result).toContain('extends BaseComponent');
      // Should be inside the class body, not before extends
      const classBodyStart = result.indexOf('{', result.indexOf('extends BaseComponent'));
      const attachIndex = result.indexOf('@AttachInternals');
      expect(attachIndex).toBeGreaterThan(classBodyStart);
    });

    it('should handle component with implements clause', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  formAssociated: true
})
export class MyComponent implements SomeInterface {
}`;
      const sourceFile = createSourceFile(code);
      const matches = formAssociatedRule.detect(sourceFile);
      const result = formAssociatedRule.transform(sourceFile, matches);

      expect(result).toContain('@AttachInternals()');
      expect(result).toContain('implements SomeInterface');
    });
  });
});
