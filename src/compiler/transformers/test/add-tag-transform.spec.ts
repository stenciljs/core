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
    it('should transform createElement calls with component tags', async () => {
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
      expect(res).toContain("const el = document.createElement(`${__stencil_transformTag('cmp-a')}`);");
    });

    it('should not transform createElement calls with non-component tags', async () => {
      const cmp = `
        @Component({ tag: 'cmp-a' })
        export class CmpA { 
          someMethod() {
            const el = document.createElement('div');
          }
        }
      `;

      const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
      const res = await formatCode(transpileResult.outputText);

      expect(transpileResult.diagnostics).toHaveLength(0);
      expect(res).toContain("const el = document.createElement('div');");
    });
  });

  describe('document.querySelector', () => {
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
  });

  describe('document.querySelectorAll', () => {
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
  });

  describe('customElements', () => {
    it('should transform customElements.get calls with component tags', async () => {
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
      expect(res).toContain("customElements.get(__stencil_transformTag('cmp-a'));");
    });

    it('should transform customElements.define calls with component tags', async () => {
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
      expect(res).toContain("customElements.define(__stencil_transformTag('cmp-a'), CmpA);");
    });
  });

  describe('complex selectors', () => {
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
});
