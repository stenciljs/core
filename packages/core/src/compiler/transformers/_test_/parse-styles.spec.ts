import { describe, expect, it } from 'vitest';

import { getStaticGetter, transpileModule } from './transpile';
import { formatCode } from './utils';

describe('parse globalStyles', () => {
  describe('static getter emission', () => {
    it('emits originalGlobalStyleUrl from globalStyleUrl', () => {
      const t = transpileModule(`
        @Component({ tag: 'cmp-a', globalStyleUrl: 'cmp-a.global.css' })
        export class CmpA {}
      `);
      expect(getStaticGetter(t.outputText, 'originalGlobalStyleUrl')).toBe('cmp-a.global.css');
    });

    it('emits globalStyle static getter from inline globalStyle', () => {
      const t = transpileModule(`
        @Component({ tag: 'cmp-a', globalStyle: 'cmp-a { display: block; }' })
        export class CmpA {}
      `);
      expect(getStaticGetter(t.outputText, 'globalStyle')).toBe('cmp-a { display: block; }');
    });

    it('trims and ignores empty globalStyle strings', () => {
      const t = transpileModule(`
        @Component({ tag: 'cmp-a', globalStyle: '   ' })
        export class CmpA {}
      `);
      expect(getStaticGetter(t.outputText, 'globalStyle')).toBeUndefined();
    });

    it('does not emit originalStyleUrls for globalStyleUrl', () => {
      const t = transpileModule(`
        @Component({ tag: 'cmp-a', globalStyleUrl: 'cmp-a.global.css' })
        export class CmpA {}
      `);
      expect(getStaticGetter(t.outputText, 'originalStyleUrls')).toBeUndefined();
    });

    it('can have both styleUrl and globalStyleUrl', () => {
      const t = transpileModule(`
        @Component({ tag: 'cmp-a', styleUrl: 'cmp-a.css', globalStyleUrl: 'cmp-a.global.css' })
        export class CmpA {}
      `);
      expect(getStaticGetter(t.outputText, 'originalStyleUrls')).toEqual({ $: ['cmp-a.css'] });
      expect(getStaticGetter(t.outputText, 'originalGlobalStyleUrl')).toBe('cmp-a.global.css');
    });
  });

  describe('metadata (cmp.globalStyles)', () => {
    it('populates globalStyles from globalStyleUrl', () => {
      const t = transpileModule(`
        @Component({ tag: 'cmp-a', globalStyleUrl: 'cmp-a.global.css' })
        export class CmpA {}
      `);
      expect(t.cmp.globalStyles).toHaveLength(1);
      expect(t.cmp.globalStyles[0].styleStr).toBeNull();
      expect(t.cmp.globalStyles[0].absolutePath).toMatch(/cmp-a\.global\.css$/);
    });

    it('resolves absolutePath relative to component file', () => {
      const t = transpileModule(`
        @Component({ tag: 'cmp-a', globalStyleUrl: '../shared/base.css' })
        export class CmpA {}
      `);
      expect(t.cmp.globalStyles[0].absolutePath).toMatch(/shared\/base\.css$/);
    });

    it('populates globalStyles from inline globalStyle', () => {
      const t = transpileModule(`
        @Component({ tag: 'cmp-a', globalStyle: 'cmp-a { color: red; }' })
        export class CmpA {}
      `);
      expect(t.cmp.globalStyles).toHaveLength(1);
      expect(t.cmp.globalStyles[0].styleStr).toBe('cmp-a { color: red; }');
      expect(t.cmp.globalStyles[0].absolutePath).toBeNull();
    });

    it('returns empty globalStyles when neither is set', () => {
      const t = transpileModule(`
        @Component({ tag: 'cmp-a' })
        export class CmpA {}
      `);
      expect(t.cmp.globalStyles).toHaveLength(0);
    });

    it('does not affect shadow styles', () => {
      const t = transpileModule(`
        @Component({ tag: 'cmp-a', styleUrl: 'cmp-a.css', globalStyleUrl: 'cmp-a.global.css' })
        export class CmpA {}
      `);
      expect(t.cmp.styles).toHaveLength(1);
      expect(t.cmp.globalStyles).toHaveLength(1);
    });
  });
});

describe('parse styles', () => {
  it('add static "styleUrl"', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        styleUrl: 'style.css'
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'styleUrls')).toEqual({ $: ['style.css'] });
  });

  it('add static "styleUrls"', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        styleUrls: ['style.css', 'style2.css']
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'styleUrls')).toEqual({ $: ['style.css', 'style2.css'] });
  });

  it('add static "styles"', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        styles: 'p{color:red}'
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'styles')).toEqual('p{color:red}');
  });

  it('add static "styles" as object', async () => {
    const t = transpileModule(`
      const md = 'p{color:red}';
      const ios = 'p{color:black}';
      @Component({
        tag: 'cmp-a',
        styles: {
          md: md,
          ios: ios,
        }
      })
      export class CmpA {}
    `);
    expect(await formatCode(t.outputText)).toEqual(
      await formatCode(
        `const md = 'p{color:red}';const ios = 'p{color:black}';export class CmpA { static get is() { return "cmp-a"; } static get styles() { return { "md": md, "ios": ios }; }}`,
      ),
    );
  });

  it('add static "styles" as object (2)', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        styles: {
          md: 'p{color:red}',
          ios: 'p{color:black}',
        }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'styles')).toEqual({
      ios: 'p{color:black}',
      md: 'p{color:red}',
    });
  });

  it('add static "styles" const', async () => {
    const t = transpileModule(`
      const styles = 'p{color:red}';
      @Component({
        tag: 'cmp-a',
        styles,
      })
      export class CmpA {}
    `);
    expect(await formatCode(t.outputText)).toEqual(
      await formatCode(
        `const styles = 'p{color:red}';export class CmpA { static get is() { return "cmp-a"; } static get styles() { return styles; }}`,
      ),
    );
  });
});
