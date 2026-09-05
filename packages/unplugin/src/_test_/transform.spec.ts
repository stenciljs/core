import { describe, expect, it } from 'vitest';

import { transformStencil } from '../transform.js';

const COMPONENT = `
import { Component, Prop, h } from '@stencil/core';
@Component({ tag: 'my-button', encapsulation: { type: 'shadow' } })
export class MyButton {
  @Prop() label = 'Click';
  render() { return <button>{this.label}</button>; }
}
`;

describe('transformStencil', () => {
  it('returns null for non-tsx/ts files', () => {
    expect(transformStencil('const x = 1;', '/src/foo.js', {})).toBeNull();
  });

  it('returns null for .d.ts files', () => {
    expect(transformStencil('export type Foo = {};', '/src/foo.d.ts', {})).toBeNull();
  });

  it('transforms a Stencil component', () => {
    const result = transformStencil(COMPONENT, '/src/my-button.tsx', {});
    expect(result).not.toBeNull();
    // customelement mode uses Stencil's defineCustomElement wrapper
    expect(result!.code).toContain('defineCustomElement');
    expect(result!.code).toContain('my-button');
  });

  it('uses customelement export by default', () => {
    const result = transformStencil(COMPONENT, '/src/my-button.tsx', {});
    // customelement export — component self-registers; no lazy loading shim
    expect(result!.code).not.toContain('bootstrapLazy');
  });

  it('rewrites CSS imports with queryparams', () => {
    const cmpWithStyle = `
      import { Component, h } from '@stencil/core';
      @Component({ tag: 'styled-cmp', styleUrl: 'styled-cmp.css', encapsulation: { type: 'shadow' } })
      export class StyledCmp { render() { return <div />; } }
    `;
    const result = transformStencil(cmpWithStyle, '/src/styled-cmp.tsx', {});
    expect(result).not.toBeNull();
    // styleImportData: 'queryparams' appends ?tag=... to the CSS import
    expect(result!.code).toMatch(/styled-cmp\.css\?/);
  });

  it('returns null for a plain TS file with no @Component', () => {
    const result = transformStencil(
      'export const add = (a: number, b: number) => a + b;',
      '/src/utils.ts',
      {},
    );
    expect(result).toBeNull();
  });

  it('returns tagName in result', () => {
    const result = transformStencil(COMPONENT, '/src/my-button.tsx', {});
    expect(result!.tagName).toBe('my-button');
  });

  describe('dev mode HMR injection', () => {
    it('injects nothing when dev=false', () => {
      const result = transformStencil(COMPONENT, '/src/my-button.tsx', {}, false);
      expect(result!.code).not.toContain('import.meta.hot');
      expect(result!.code).not.toContain('__stencil_module__');
    });

    it('injects Vite HMR snippet for vite framework', () => {
      const result = transformStencil(COMPONENT, '/src/my-button.tsx', {}, true, 'vite');
      expect(result!.code).toContain('__stencil_module__ = import.meta.url');
      expect(result!.code).toContain("import.meta.hot.on('stencil:hmr'");
      expect(result!.code).toContain('import.meta.hot.accept');
      expect(result!.code).toContain('"my-button"');
    });

    it('injects Vite HMR snippet as default when framework is unrecognised', () => {
      const result = transformStencil(COMPONENT, '/src/my-button.tsx', {}, true, 'rollup');
      expect(result!.code).toContain("import.meta.hot.on('stencil:hmr'");
    });

    it('injects webpack HMR snippet for webpack framework', () => {
      const result = transformStencil(COMPONENT, '/src/my-button.tsx', {}, true, 'webpack');
      expect(result!.code).toContain('__stencil_module__ = import.meta.url');
      expect(result!.code).toContain('module.hot');
      expect(result!.code).toContain('import.meta.webpackHot');
      expect(result!.code).toContain('stencilHmr');
      expect(result!.code).toContain('_sHot.dispose');
      expect(result!.code).toContain('_sHot.accept');
      expect(result!.code).not.toContain("import.meta.hot.on('stencil:hmr'");
    });

    it('injects webpack HMR snippet for rspack framework', () => {
      const result = transformStencil(COMPONENT, '/src/my-button.tsx', {}, true, 'rspack');
      expect(result!.code).toContain('module.hot');
      expect(result!.code).toContain('import.meta.webpackHot');
      expect(result!.code).not.toContain("import.meta.hot.on('stencil:hmr'");
    });

    it('injects bun HMR snippet using import.meta.hot with dispose/accept/data', () => {
      const result = transformStencil(COMPONENT, '/src/my-button.tsx', {}, true, 'bun');
      expect(result!.code).toContain('__stencil_module__ = import.meta.url');
      expect(result!.code).toContain('var _sHot = import.meta.hot');
      expect(result!.code).toContain('stencilHmr');
      expect(result!.code).toContain('_sHot.dispose');
      expect(result!.code).toContain('_sHot.accept');
      // bun does NOT use the custom WS event path
      expect(result!.code).not.toContain("import.meta.hot.on('stencil:hmr'");
      // bun does NOT use module.hot / webpackHot
      expect(result!.code).not.toContain('module.hot');
      expect(result!.code).not.toContain('webpackHot');
    });

    it('re-execution snippet patches registered ctor and calls connectedCallback', () => {
      const result = transformStencil(COMPONENT, '/src/my-button.tsx', {}, true, 'webpack');
      expect(result!.code).toContain('customElements.get("my-button")');
      expect(result!.code).toContain('Object.getOwnPropertyNames(MyButton.prototype)');
      expect(result!.code).toContain('connectedCallback');
    });
  });

  describe('mode: spec-page', () => {
    it('emits COMPILER_META instead of a self-registering custom element', () => {
      const result = transformStencil(COMPONENT, '/src/my-button.tsx', { mode: 'spec-page' });
      expect(result).not.toBeNull();
      expect(result!.code).toContain('COMPILER_META');
      expect(result!.code).not.toContain('defineCustomElement');
      expect(result!.code).not.toContain('bootstrapLazy');
    });

    it('imports from @stencil/core/testing rather than the standalone client', () => {
      const result = transformStencil(COMPONENT, '/src/my-button.tsx', { mode: 'spec-page' });
      expect(result!.code).toContain('@stencil/core/testing');
    });

    it('does not double-export the class (compilerstatic keeps the source export)', () => {
      const result = transformStencil(COMPONENT, '/src/my-button.tsx', { mode: 'spec-page' });
      expect(result!.code).toMatch(/export const MyButton/);
      expect(result!.code).not.toContain('export{MyButton}');
    });

    it('injects no HMR snippet even when dev=true', () => {
      const result = transformStencil(
        COMPONENT,
        '/src/my-button.tsx',
        { mode: 'spec-page' },
        true,
        'vite',
      );
      expect(result!.code).not.toContain('import.meta.hot');
      expect(result!.code).not.toContain('__stencil_module__');
    });

    it('does not emit an unresolved styleUrl import (no CSS loader needed for spec-page tests)', () => {
      const cmpWithStyle = `
        import { Component, h } from '@stencil/core';
        @Component({ tag: 'styled-cmp', styleUrl: 'styled-cmp.css', encapsulation: { type: 'shadow' } })
        export class StyledCmp { render() { return <div />; } }
      `;
      const result = transformStencil(cmpWithStyle, '/src/styled-cmp.tsx', { mode: 'spec-page' });
      expect(result).not.toBeNull();
      // the file path is still recorded in COMPILER_META.styles[].externalStyles
      // (harmless metadata) but nothing should `import` it
      expect(result!.code).not.toMatch(/from ["'].*styled-cmp\.css/);
      expect(result!.code).toContain('externalStyles');
    });
  });
});
