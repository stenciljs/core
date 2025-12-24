import { mockBuildCtx } from '@stencil/core/testing';
import { addTagTransform } from '../add-tag-transform';
import { transpileModule } from './transpile';
import { formatCode } from './utils';

describe('add-tag-transform', () => {
  let buildCtx: any;
  let compilerCtx: any;
  let transformer: any;

  beforeEach(() => {
    buildCtx = mockBuildCtx();
    compilerCtx = buildCtx.compilerCtx;

    buildCtx.components.push(
      // @ts-ignore - just testing
      { tagName: 'cmp-a' },
      // @ts-ignore - just testing
      { tagName: 'cmp-b' },
    );

    transformer = addTagTransform(compilerCtx, buildCtx);
  });

  describe('document.createElement', () => {
    it('should leave literal createElement calls untouched', async () => {
      const cmp = `
        @Component({ tag: 'cmp-a' })
        export class CmpA { 
          someMethod() {
            const el = document.createElement('cmp-a');
          }
        }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain("const el = document.createElement('cmp-a');");
    });

    it('should transform non-literal createElement arguments', async () => {
      const cmp = `
        @Component({ tag: 'cmp-a' })
        export class CmpA { 
          someMethod() {
            const tag = 'div';
            const el = document.createElement(tag);
          }
        }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain('const el = document.createElement(__stencil_transformTag(tag));');
    });
  });

  describe('document.querySelector, document.querySelectorAll, document.closest', () => {
    it('should transform querySelector calls with component tags', async () => {
      const cmp = `
        @Component({ tag: 'cmp-a' })
        export class CmpA { 
          someMethod() {
            const queriedEl = document.querySelector('cmp-b#id');
          }
        }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain("const queriedEl = document.querySelector(`${__stencil_transformTag('cmp-b')}#id`);");
    });

    it('should not transform querySelector calls with non-component tags', async () => {
      const cmp = `
        @Component({ tag: 'cmp-a' })
        export class CmpA { 
          someMethod() {
            const queriedEl = document.querySelector('cmp-left-alone');
          }
        }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain("const queriedEl = document.querySelector('cmp-left-alone');");
    });

    it('should transform querySelectorAll calls with mixed component and non-component tags', async () => {
      const cmp = `
        @Component({ tag: 'cmp-a' })
        export class CmpA { 
          someMethod() {
            const queriedEls = document.querySelectorAll('cmp-a[data-attr], cmp-b.class, cmp-left-alone');
          }
        }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain(
        "`${__stencil_transformTag('cmp-a')}[data-attr], ${__stencil_transformTag('cmp-b')}.class, cmp-left-alone`",
      );
    });

    it('should handle querySelectorAll with only component tags', async () => {
      const cmp = `
        @Component({ tag: 'cmp-a' })
        export class CmpA { 
          someMethod() {
            const queriedEls = document.querySelectorAll('cmp-a, cmp-b');
          }
        }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain("`${__stencil_transformTag('cmp-a')}, ${__stencil_transformTag('cmp-b')}`");
    });

    it('should transform closest calls with component tags', async () => {
      const cmp = `
        @Component({ tag: 'cmp-a' })
        export class CmpA { 
          someMethod() {
            const el = document.querySelector('div');
            const closestCmp = el.closest('cmp-b');
          }
        }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain("const closestCmp = el.closest(`${__stencil_transformTag('cmp-b')}`);");
    });

    it('should handle complex CSS selectors with multiple components', async () => {
      const cmp = `
        @Component({ tag: 'cmp-a' })
        export class CmpA { 
          someMethod() {
            const el = document.querySelector('cmp-a > cmp-b + .some-class[attr="value"]');
          }
        }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain(
        "`${__stencil_transformTag('cmp-a')} > ${__stencil_transformTag('cmp-b')} + .some-class[attr=\"value\"]`",
      );
    });

    it('should handle pseudo-selectors with component tags', async () => {
      const cmp = `
        @Component({ tag: 'cmp-a' })
        export class CmpA { 
          someMethod() {
            const el = document.querySelector('cmp-a:hover');
          }
        }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain("document.querySelector(`${__stencil_transformTag('cmp-a')}:hover`");
    });
  });

  describe('customElements', () => {
    it('should leave literal customElements.get calls untouched', async () => {
      const cmp = `
        @Component({ tag: 'cmp-a' })
        export class CmpA { 
          someMethod() {
            const currentDefinition = customElements.get('cmp-a');
          }
        }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain("customElements.get('cmp-a');");
    });

    it('should transform non-literal customElements.get arguments', async () => {
      const cmp = `
        @Component({ tag: 'cmp-a' })
        export class CmpA { 
          someMethod() {
            const tag = 'cmp-a';
            const currentDefinition = customElements.get(tag);
          }
        }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain('customElements.get(__stencil_transformTag(tag));');
    });

    it('should leave literal customElements.define calls untouched', async () => {
      const cmp = `
        @Component({ tag: 'cmp-a' })
        export class CmpA { 
          someMethod() {
            customElements.define('cmp-a', CmpA);
          }
        }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain("customElements.define('cmp-a', CmpA);");
    });

    it('should transform non-literal customElements.define arguments', async () => {
      const cmp = `
        @Component({ tag: 'cmp-a' })
        export class CmpA { 
          someMethod() {
            const tag = 'cmp-a';
            customElements.define(tag, CmpA);
          }
        }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain('customElements.define(__stencil_transformTag(tag), CmpA);');
    });

    it('should leave literal customElements.whenDefined calls untouched', async () => {
      const cmp = `
      @Component({ tag: 'cmp-a' })
      export class CmpA { 
        someMethod() {
        customElements.whenDefined('cmp-a').then(() => console.log('defined'));
        }
      }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain("customElements.whenDefined('cmp-a')");
    });

    it('should transform non-literal customElements.whenDefined arguments', async () => {
      const cmp = `
      @Component({ tag: 'cmp-a' })
      export class CmpA { 
        someMethod() {
        const tag = 'cmp-a';
        customElements.whenDefined(tag).then(() => console.log('defined'));
        }
      }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain('customElements.whenDefined(__stencil_transformTag(tag))');
    });
  });

  // feels a bit OTT(?)

  // describe('binary expressions', () => {
  //   it('should transform tag name comparisons with component tags', async () => {
  //     const cmp = `
  //       @Component({ tag: 'cmp-a' })
  //       export class CmpA {
  //         someMethod() {
  //           const el = document.createElement('div');
  //           if (el.tagName === 'cmp-a') {
  //             console.log('is cmp-a');
  //           }
  //           if ('cmp-b' == el.tagName) {
  //             console.log('is cmp-b');
  //           }
  //         }
  //       }
  //     `;

  //     const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
  //     const res = await formatCode(transpileResult.outputText);

  //     expect(transpileResult.diagnostics).toHaveLength(0);
  //     expect(res).toContain("if (el.tagName === __stencil_transformTag('cmp-a')) {");
  //     expect(res).toContain("if (__stencil_transformTag('cmp-b') == el.tagName) {");
  //   });
  // });
});
