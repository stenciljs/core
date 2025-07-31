import { mockCompilerCtx } from '@stencil/core/testing';

import type * as d from '../../../declarations';
import { lazyComponentTransform } from '../component-lazy/transform-lazy-component';
import { transpileModule } from './transpile';
import { c, formatCode } from './utils';

describe('lazy-component', () => {
  it('add registerInstance() to constructor w/ decorator on class', () => {
    const compilerCtx = mockCompilerCtx();
    const transformOpts: d.TransformOptions = {
      coreImportPath: '@stencil/core',
      componentExport: 'lazy',
      componentMetadata: null,
      currentDirectory: '/',
      proxy: null,
      style: 'static',
      styleImportData: null,
    };

    const code = `
      @Component({
        tag: 'cmp-a'
      })
      export class CmpA {
        @format something = '12';
      }
    `;

    const transformer = lazyComponentTransform(compilerCtx, transformOpts);

    const t = transpileModule(code, null, compilerCtx, [], [transformer], []);

    expect(t.outputText).toContain(`import { registerInstance as __stencil_registerInstance } from "@stencil/core"`);
    expect(t.outputText).toContain(`__stencil_registerInstance(this, hostRef)`);
  });

  it('adds a getter for an @Element() reference', () => {
    const compilerCtx = mockCompilerCtx();
    const transformOpts: d.TransformOptions = {
      coreImportPath: '@stencil/core',
      componentExport: 'lazy',
      componentMetadata: null,
      currentDirectory: '/',
      proxy: null,
      style: 'static',
      styleImportData: null,
    };

    const code = `
      @Component({
        tag: 'cmp-a'
      })
      export class CmpA {
        @Element() el: HtmlElement;
      }
    `;

    const transformer = lazyComponentTransform(compilerCtx, transformOpts);

    const t = transpileModule(code, null, compilerCtx, [], [transformer]);

    expect(t.outputText).toContain(`get el() { return __stencil_getElement(this); } };`);
    expect(t.outputText).not.toContain(`el;`);
  });

  it('adds an `attachInternals` call with a `@AttachInternals` decoration', async () => {
    const compilerCtx = mockCompilerCtx();
    const transformOpts: d.TransformOptions = {
      coreImportPath: '@stencil/core',
      componentExport: 'lazy',
      componentMetadata: null,
      currentDirectory: '/',
      proxy: null,
      style: 'static',
      styleImportData: null,
    };

    const code = `
      @Component({
        tag: 'cmp-a',
        formAssociated: true
      })
      export class CmpA {
        @AttachInternals() internals: ElementInternals;
      }
    `;

    const transformer = lazyComponentTransform(compilerCtx, transformOpts);
    const t = transpileModule(code, null, compilerCtx, [], [transformer]);

    expect(await formatCode(t.outputText)).toBe(
      await c`import { registerInstance as __stencil_registerInstance } from "@stencil/core";
      export const CmpA = class {
        constructor (hostRef) {
          __stencil_registerInstance(this, hostRef);
          if (hostRef.$hostElement$["s-ei"]) {
            this.internals = hostRef.$hostElement$["s-ei"];
          } else {
            this.internals = hostRef.$hostElement$.attachInternals();
            hostRef.$hostElement$["s-ei"] = this.internals;
          }
        }
        static get formAssociated() {
          return true;
        }
      }`,
    );
  });

  describe('styling', () => {
    function verifyStylingUsingComponent(inputComponent: string, expectedOutput: string) {
      return async () => {
        const compilerCtx = mockCompilerCtx();
        const transformOpts: d.TransformOptions = {
          coreImportPath: '@stencil/core',
          componentExport: 'lazy',
          componentMetadata: null,
          currentDirectory: '/',
          proxy: null,
          style: 'static',
          styleImportData: null,
        };

        const transformer = lazyComponentTransform(compilerCtx, transformOpts);
        const t = transpileModule(inputComponent, null, compilerCtx, [], [transformer]);
        expect(await formatCode(t.outputText)).toBe(await formatCode(expectedOutput));
      };
    }

    // eslint-disable-next-line jest/expect-expect
    it(
      'using `styleUrl` parameter',
      verifyStylingUsingComponent(
        `
        @Component({
          tag: 'cmp-a',
          styleUrl: 'cmp-a.css'
        })
        export class CmpA {}
      `,
        `
        import { registerInstance as __stencil_registerInstance } from "@stencil/core";
        import CmpAStyle0 from './cmp-a.css';
        export const CmpA = class {
          constructor (hostRef) {
            __stencil_registerInstance(this, hostRef);
          }
        };
        CmpA.style = CmpAStyle0;
      `,
      ),
    );

    // eslint-disable-next-line jest/expect-expect
    it(
      'using `styleUrls` parameter as object',
      verifyStylingUsingComponent(
        `
        @Component({
          tag: 'cmp-a',
          styleUrls: {
            foo: 'cmp-a.foo.css',
            bar: 'cmp-a.bar.css',
          }
        })
        export class CmpA {}
      `,
        `
        import { registerInstance as __stencil_registerInstance } from "@stencil/core";
        import CmpABarStyle0 from './cmp-a.bar.css';
        import CmpAFooStyle0 from './cmp-a.foo.css';
        export const CmpA = class {
          constructor (hostRef) {
            __stencil_registerInstance(this, hostRef);
          }
        };
        CmpA.style = { bar: CmpABarStyle0, foo: CmpAFooStyle0 };
      `,
      ),
    );

    // eslint-disable-next-line jest/expect-expect
    it(
      'using `styleUrls` parameter as array',
      verifyStylingUsingComponent(
        `
        @Component({
          tag: 'cmp-a',
          styleUrls: ['cmp-a.foo.css', 'cmp-a.bar.css', 'cmp-a.foo.css'],
        })
        export class CmpA {}
      `,
        `
        import { registerInstance as __stencil_registerInstance } from "@stencil/core";
        import CmpAStyle0 from './cmp-a.bar.css';
        import CmpAStyle1 from './cmp-a.foo.css';
        export const CmpA = class {
          constructor (hostRef) {
            __stencil_registerInstance(this, hostRef);
          }
        };
        CmpA.style = CmpAStyle0 + CmpAStyle1;
      `,
      ),
    );
  });
});
