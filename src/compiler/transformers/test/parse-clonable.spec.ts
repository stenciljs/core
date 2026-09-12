import { getStaticGetter, transpileModule } from './transpile';

describe('parse clonable', () => {
  it('shadow without clonable', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        shadow: true
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toEqual('shadow');
    expect(getStaticGetter(t.outputText, 'clonable')).toEqual(undefined);

    expect(t.cmp.encapsulation).toBe('shadow');
    expect(t.cmp.shadowClonable).toBe(false);
  });

  it('clonable true', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        shadow: {
          clonable: true
        }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toEqual('shadow');
    expect(getStaticGetter(t.outputText, 'clonable')).toEqual(true);

    expect(t.cmp.encapsulation).toBe('shadow');
    expect(t.cmp.shadowClonable).toBe(true);
  });

  it('clonable false (explicit)', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        shadow: {
          clonable: false
        }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toEqual('shadow');
    expect(getStaticGetter(t.outputText, 'clonable')).toEqual(undefined);

    expect(t.cmp.encapsulation).toBe('shadow');
    expect(t.cmp.shadowClonable).toBe(false);
  });

  it('clonable true alongside delegatesFocus', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        shadow: {
          delegatesFocus: true,
          clonable: true
        }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toEqual('shadow');
    expect(getStaticGetter(t.outputText, 'delegatesFocus')).toEqual(true);
    expect(getStaticGetter(t.outputText, 'clonable')).toEqual(true);

    expect(t.cmp.encapsulation).toBe('shadow');
    expect(t.cmp.shadowDelegatesFocus).toBe(true);
    expect(t.cmp.shadowClonable).toBe(true);
  });

  it('scoped does not support clonable', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        scoped: true
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toEqual('scoped');
    expect(getStaticGetter(t.outputText, 'clonable')).toEqual(undefined);

    expect(t.cmp.encapsulation).toBe('scoped');
    expect(t.cmp.shadowClonable).toBe(false);
  });

  it('no encapsulation does not support clonable', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a'
      })
      export class CmpA {}
    `);

    expect(t.outputText).not.toContain(`static get encapsulation()`);
    expect(getStaticGetter(t.outputText, 'clonable')).toEqual(undefined);

    expect(t.cmp.encapsulation).toBe('none');
    expect(t.cmp.shadowClonable).toBe(false);
  });
});
