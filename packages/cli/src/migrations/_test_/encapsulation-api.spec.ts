import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { encapsulationApiRule } from '../rules/encapsulation-api';

/**
 * Helper to create a TypeScript source file from code string
 */
function createSourceFile(code: string): ts.SourceFile {
  return ts.createSourceFile('test.tsx', code, ts.ScriptTarget.Latest, true);
}

describe('encapsulation-api migration rule', () => {
  describe('metadata', () => {
    it('should have correct rule metadata', () => {
      expect(encapsulationApiRule.id).toBe('encapsulation-api');
      expect(encapsulationApiRule.name).toBe('Encapsulation API');
      expect(encapsulationApiRule.fromVersion).toBe('4.x');
      expect(encapsulationApiRule.toVersion).toBe('5.x');
    });
  });

  describe('detect', () => {
    it('should detect shadow: true', () => {
      const code = `
        import { Component } from '@stencil/core';
        @Component({
          tag: 'my-component',
          shadow: true
        })
        export class MyComponent {}
      `;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain("'shadow'");
    });

    it('should detect shadow: false', () => {
      const code = `
        import { Component } from '@stencil/core';
        @Component({
          tag: 'my-component',
          shadow: false
        })
        export class MyComponent {}
      `;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
    });

    it('should detect shadow with options object', () => {
      const code = `
        import { Component } from '@stencil/core';
        @Component({
          tag: 'my-component',
          shadow: { delegatesFocus: true }
        })
        export class MyComponent {}
      `;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
    });

    it('should detect scoped: true', () => {
      const code = `
        import { Component } from '@stencil/core';
        @Component({
          tag: 'my-component',
          scoped: true
        })
        export class MyComponent {}
      `;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
      expect(matches[0].message).toContain("'scoped'");
    });

    it('should detect both shadow and scoped in same file', () => {
      const code = `
        import { Component } from '@stencil/core';
        @Component({
          tag: 'cmp-a',
          shadow: true
        })
        export class CmpA {}

        @Component({
          tag: 'cmp-b',
          scoped: true
        })
        export class CmpB {}
      `;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);

      expect(matches).toHaveLength(2);
    });

    it('should not detect when using new encapsulation API', () => {
      const code = `
        import { Component } from '@stencil/core';
        @Component({
          tag: 'my-component',
          encapsulation: { type: 'shadow' }
        })
        export class MyComponent {}
      `;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);

      expect(matches).toHaveLength(0);
    });

    it('should not detect components without shadow or scoped', () => {
      const code = `
        import { Component } from '@stencil/core';
        @Component({
          tag: 'my-component'
        })
        export class MyComponent {}
      `;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);

      expect(matches).toHaveLength(0);
    });

    it('should provide correct line numbers', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  shadow: true
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);

      expect(matches).toHaveLength(1);
      expect(matches[0].line).toBe(4); // shadow: true is on line 4
    });
  });

  describe('transform', () => {
    it('should transform shadow: true to encapsulation: { type: "shadow" }', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  shadow: true
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);
      const result = encapsulationApiRule.transform(sourceFile, matches);

      expect(result).toContain("encapsulation: { type: 'shadow' }");
      expect(result).not.toContain('shadow: true');
    });

    it('should transform shadow: false by removing it', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  shadow: false
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);
      const result = encapsulationApiRule.transform(sourceFile, matches);

      expect(result).not.toContain('shadow');
      expect(result).not.toContain('encapsulation');
    });

    it('should transform shadow with delegatesFocus', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  shadow: { delegatesFocus: true }
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);
      const result = encapsulationApiRule.transform(sourceFile, matches);

      expect(result).toContain("encapsulation: { type: 'shadow', delegatesFocus: true }");
      expect(result).not.toContain('shadow: {');
    });

    it('should transform shadow with slotAssignment', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  shadow: { slotAssignment: 'manual' }
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);
      const result = encapsulationApiRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'shadow'");
      expect(result).toContain("slotAssignment: 'manual'");
    });

    it('should transform shadow with multiple options', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  shadow: { delegatesFocus: true, slotAssignment: 'manual' }
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);
      const result = encapsulationApiRule.transform(sourceFile, matches);

      expect(result).toContain("type: 'shadow'");
      expect(result).toContain('delegatesFocus: true');
      expect(result).toContain("slotAssignment: 'manual'");
    });

    it('should transform scoped: true to encapsulation: { type: "scoped" }', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  scoped: true
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);
      const result = encapsulationApiRule.transform(sourceFile, matches);

      expect(result).toContain("encapsulation: { type: 'scoped' }");
      expect(result).not.toContain('scoped: true');
    });

    it('should transform scoped: false by removing it', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  scoped: false
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);
      const result = encapsulationApiRule.transform(sourceFile, matches);

      expect(result).not.toContain('scoped');
      expect(result).not.toContain('encapsulation');
    });

    it('should preserve other component options', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  shadow: true
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const matches = encapsulationApiRule.detect(sourceFile);
      const result = encapsulationApiRule.transform(sourceFile, matches);

      expect(result).toContain("tag: 'my-component'");
      expect(result).toContain("styleUrl: 'my-component.css'");
      expect(result).toContain("encapsulation: { type: 'shadow' }");
    });

    it('should return original text when no matches', () => {
      const code = `import { Component } from '@stencil/core';
@Component({
  tag: 'my-component'
})
export class MyComponent {}`;
      const sourceFile = createSourceFile(code);
      const result = encapsulationApiRule.transform(sourceFile, []);

      expect(result).toBe(code);
    });
  });
});
