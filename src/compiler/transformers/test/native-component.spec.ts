import * as d from '@stencil/core/declarations';
import { mockCompilerCtx } from '@stencil/core/testing';

import { nativeComponentTransform } from '../component-native/tranform-to-native-component';
import { transpileModule } from './transpile';
import { c, formatCode } from './utils';

describe('nativeComponentTransform', () => {
  let compilerCtx: d.CompilerCtx;
  let transformOpts: d.TransformOptions;

  beforeEach(() => {
    compilerCtx = mockCompilerCtx();
    transformOpts = {
      coreImportPath: '@stencil/core',
      componentExport: 'customelement',
      componentMetadata: null,
      currentDirectory: '/',
      proxy: null,
      style: 'static',
      styleImportData: undefined,
    };
  });

  it('outputs a component extending HTMLElement', async () => {
    const code = `
    @Component({
      tag: 'cmp-a',
    })
    export class CmpA {
    }
    `;

    const transformer = nativeComponentTransform(compilerCtx, transformOpts);
    const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

    expect(await formatCode(transpiledModule.outputText)).toBe(
      await c`import { HTMLElement } from "@stencil/core";
        const CmpA = class extends HTMLElement {
          static get is() {
            return 'cmp-a';
          }
        };
        customElements.define("cmp-a", CmpA);`,
    );
  });

  describe('updateNativeComponentClass', () => {
    it("adds __attachShadow() calls when a component doesn't have a constructor", () => {
      const code = `
          @Component({
            tag: 'cmp-a',
            shadow: true,
          })
          export class CmpA {
            @Prop() foo: number;
          }
        `;

      const transformer = nativeComponentTransform(compilerCtx, transformOpts);
      const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

      expect(transpiledModule.outputText).toContain(
        `import { defineCustomElement as __stencil_defineCustomElement, HTMLElement } from "@stencil/core";`,
      );
      expect(transpiledModule.outputText).toContain(`this.__attachShadow()`);
    });

    it('adds __attachShadow() calls when a component has a constructor', () => {
      const code = `
          @Component({
            tag: 'cmp-a',
            shadow: true,
          })
          export class CmpA {
            @Prop() foo: number;

            constructor() {
              super();
            }
          }
        `;

      const transformer = nativeComponentTransform(compilerCtx, transformOpts);

      const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

      expect(transpiledModule.outputText).toContain(
        `import { defineCustomElement as __stencil_defineCustomElement, HTMLElement } from "@stencil/core";`,
      );
      expect(transpiledModule.outputText).toContain(`this.__attachShadow()`);
    });

    it('adds a getter for an @Element() reference', () => {
      const code = `
        @Component({
          tag: 'cmp-a'
        })
        export class CmpA {
          @Element() el: HtmlElement;
        }
      `;

      const transformer = nativeComponentTransform(compilerCtx, transformOpts);

      const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

      expect(transpiledModule.outputText).toContain(`get el() { return this; }`);
      expect(transpiledModule.outputText).not.toContain(`el;`);
    });
  });

  describe('updateNativeConstructor', () => {
    it('adds a getter for formAssociated', async () => {
      const code = `
        @Component({
          tag: 'cmp-a', formAssociated: true
        })
        export class CmpA {
        }
      `;

      const transformer = nativeComponentTransform(compilerCtx, transformOpts);

      const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);
      await formatCode(transpiledModule.outputText);

      expect(await formatCode(transpiledModule.outputText)).toContain(
        await c`const CmpA = class extends HTMLElement {
          constructor() {
            super();
            this.__registerHost();
          }
          static get formAssociated() {
            return true;
          }
        }`,
      );
    });

    it('adds a binding for @AttachInternals', async () => {
      const code = `
        @Component({
          tag: 'cmp-a', formAssociated: true
        })
        export class CmpA {
          @AttachInternals() internals;
        }
      `;

      const transformer = nativeComponentTransform(compilerCtx, transformOpts);

      const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

      expect(await formatCode(transpiledModule.outputText)).toContain(
        await c`const CmpA = class extends HTMLElement {
          constructor() {
            super();
            this.__registerHost();
            this.internals = this.attachInternals();
          }
          static get formAssociated() {
            return true;
          }
        };`,
      );
    });
  });

  describe('static style property', () => {
    it.each([
      [`styleUrl: 'cmp-a.css'`, `import CmpAStyle0 from './cmp-a.css?tag=cmp-a';`, `CmpAStyle0`],
      [
        `styleUrls: ['cmp-a.css', 'cmp-b.css', 'cmp-a.css']`,
        `import CmpAStyle0 from './cmp-b.css?tag=cmp-a';
         import CmpAStyle1 from './cmp-a.css?tag=cmp-a';`,
        `CmpAStyle0 + CmpAStyle1`,
      ],
      [
        `styleUrls: { ios: 'cmp-a.ios.css', md: 'cmp-a.md.css' }`,
        `import CmpAIosStyle0 from './cmp-a.ios.css?tag=cmp-a&mode=ios';
        import CmpAMdStyle0 from './cmp-a.md.css?tag=cmp-a&mode=md';`,
        `{ ios: CmpAIosStyle0, md: CmpAMdStyle0 }`,
      ],
    ])('adds a static style property when %s', async (styleConfig, expectedImport, expectedStyleReturn) => {
      const code = `
        @Component({
          tag: 'cmp-a',
          ${styleConfig}
        }
        export class CmpA {}
      `;
      const transformer = nativeComponentTransform(compilerCtx, transformOpts);
      const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

      expect(await formatCode(transpiledModule.outputText)).toContain(
        await formatCode(`import { defineCustomElement as __stencil_defineCustomElement, HTMLElement } from '@stencil/core';
          ${expectedImport}
          const CmpA = class extends HTMLElement {
            constructor() {
              super();
              this.__registerHost();
            }
            static get style() {
              return ${expectedStyleReturn};
            }
          };
        `),
      );
    });
  });
});
