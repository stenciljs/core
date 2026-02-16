import { getStaticGetter, transpileModule } from './transpile';

describe('parse encapsulation', () => {
  it('shadow', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        shadow: true
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toEqual('shadow');
    expect(getStaticGetter(t.outputText, 'delegatesFocus')).toEqual(undefined);
    expect(getStaticGetter(t.outputText, 'mode')).toEqual(undefined);

    expect(t.cmp.encapsulation).toBe('shadow');
    expect(t.cmp.shadowDelegatesFocus).toBe(false);
  });

  it('delegatesFocus true', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        shadow: {
          delegatesFocus: true
        }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toEqual('shadow');
    expect(getStaticGetter(t.outputText, 'delegatesFocus')).toEqual(true);
    expect(getStaticGetter(t.outputText, 'mode')).toEqual(undefined);

    expect(t.cmp.encapsulation).toBe('shadow');
    expect(t.cmp.shadowDelegatesFocus).toBe(true);
  });

  it('delegatesFocus false', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        shadow: {
          delegatesFocus: false
        }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toEqual('shadow');
    expect(getStaticGetter(t.outputText, 'delegatesFocus')).toEqual(undefined);
    expect(getStaticGetter(t.outputText, 'mode')).toEqual(undefined);

    expect(t.cmp.encapsulation).toBe('shadow');
    expect(t.cmp.shadowDelegatesFocus).toBe(false);
  });

  it('scoped', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        scoped: true
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toEqual('scoped');
    expect(t.cmp.encapsulation).toBe('scoped');
    expect(t.cmp.shadowDelegatesFocus).toBe(false);
  });

  it('no encapsulation', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a'
      })
      export class CmpA {}
    `);

    expect(t.outputText).not.toContain(`static get encapsulation()`);
    expect(t.cmp.encapsulation).toBe('none');
    expect(t.cmp.shadowDelegatesFocus).toBe(false);
  });
});
