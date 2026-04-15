import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

import { transpile } from '../../transpile';

const fixturesDir = join(__dirname, 'fixtures');

/**
 * Reads a fixture file from the `_test_/fixtures` directory relative to this spec.
 */
const fixture = (name: string) => readFileSync(join(fixturesDir, name), 'utf-8');

/**
 * Tests for `transpile()` with `style: 'inline'` option.
 *
 * When `style: 'inline'` is set, styleUrls should be resolved and inlined
 * directly into the transpiled output, rather than generating imports.
 */
describe('transpile() – style: inline', () => {
  describe('single styleUrl', () => {
    const componentCode = `
      import { Component } from '@stencil/core';

      @Component({
        tag: 'my-component',
        styleUrl: 'inline-style.css'
      })
      export class MyComponent {}
    `;

    it('inlines CSS when style: inline and file exists on disk', async () => {
      const results = await transpile(componentCode, {
        file: join(fixturesDir, 'my-component.tsx'),
        currentDirectory: fixturesDir,
        style: 'inline',
      });

      expect(results.diagnostics).toHaveLength(0);

      // Should have inlined styles, not styleUrls
      expect(results.code).toContain('static get style()');
      expect(results.code).toContain(':host');
      expect(results.code).toContain('color: red');

      // Should NOT have styleUrls when inlined
      expect(results.code).not.toContain('static get styleUrls()');
    });

    it('falls back to styleUrls when style: static (default)', async () => {
      const results = await transpile(componentCode, {
        file: join(fixturesDir, 'my-component.tsx'),
        currentDirectory: fixturesDir,
        style: 'static',
      });

      expect(results.diagnostics).toHaveLength(0);

      // Should have styleUrls, not inlined styles
      expect(results.code).toContain('static get style()');
      expect(results.code).toContain('inline-style.css');

      // Should NOT have the actual CSS content
      expect(results.code).not.toContain('color: red');
    });
  });

  describe('multiple styleUrls', () => {
    const componentCode = `
      import { Component } from '@stencil/core';

      @Component({
        tag: 'my-component',
        styleUrls: ['inline-style.css', 'inline-style.css']
      })
      export class MyComponent {}
    `;

    it('concatenates multiple CSS files when inlined', async () => {
      const results = await transpile(componentCode, {
        file: join(fixturesDir, 'my-component.tsx'),
        currentDirectory: fixturesDir,
        style: 'inline',
      });

      expect(results.diagnostics).toHaveLength(0);
      expect(results.code).toContain('static get style()');
      // Should contain the CSS content (concatenated)
      expect(results.code).toContain(':host');
    });
  });

  describe('mode-based styleUrls', () => {
    it('creates object with mode keys when inlined', async () => {
      // Create a second CSS file for testing
      const componentCode = `
        import { Component } from '@stencil/core';

        @Component({
          tag: 'my-component',
          styleUrls: {
            ios: 'inline-style.css',
            md: 'inline-style.css'
          }
        })
        export class MyComponent {}
      `;

      const results = await transpile(componentCode, {
        file: join(fixturesDir, 'my-component.tsx'),
        currentDirectory: fixturesDir,
        style: 'inline',
      });

      expect(results.diagnostics).toHaveLength(0);
      expect(results.code).toContain('static get style()');
      // Should have mode keys in the styles object
      expect(results.code).toContain('ios');
      expect(results.code).toContain('md');
    });
  });

  describe('inline styles with existing styles property', () => {
    it('preserves inline styles property (no styleUrls)', async () => {
      const componentCode = `
        import { Component } from '@stencil/core';

        @Component({
          tag: 'my-component',
          styles: ':host { display: flex; }'
        })
        export class MyComponent {}
      `;

      const results = await transpile(componentCode, {
        file: join(fixturesDir, 'my-component.tsx'),
        currentDirectory: fixturesDir,
        style: 'inline',
      });

      expect(results.diagnostics).toHaveLength(0);
      expect(results.code).toContain('static get style()');
      expect(results.code).toContain('display: flex');
    });
  });
});
