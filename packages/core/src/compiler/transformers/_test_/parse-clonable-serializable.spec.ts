import { describe, expect, it } from 'vitest';

import { getStaticGetter, transpileModule } from './transpile';

describe('parse clonable', () => {
  it('shadow without clonable', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        encapsulation: { type: 'shadow' }
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
        encapsulation: {
          type: 'shadow',
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

  it('clonable false', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        encapsulation: {
          type: 'shadow',
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

  it('scoped does not support clonable', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        encapsulation: { type: 'scoped' }
      })
      export class CmpA {}
    `);

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

    expect(t.cmp.encapsulation).toBe('none');
    expect(t.cmp.shadowClonable).toBe(false);
  });

  it('clonable alongside delegatesFocus', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        encapsulation: {
          type: 'shadow',
          delegatesFocus: true,
          clonable: true
        }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'delegatesFocus')).toEqual(true);
    expect(getStaticGetter(t.outputText, 'clonable')).toEqual(true);

    expect(t.cmp.shadowDelegatesFocus).toBe(true);
    expect(t.cmp.shadowClonable).toBe(true);
  });
});

describe('parse serializable', () => {
  it('shadow without serializable', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        encapsulation: { type: 'shadow' }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'serializable')).toEqual(undefined);
    expect(t.cmp.shadowSerializable).toBe(false);
  });

  it('serializable true', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        encapsulation: {
          type: 'shadow',
          serializable: true
        }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'serializable')).toEqual(true);
    expect(t.cmp.shadowSerializable).toBe(true);
  });

  it('serializable false', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        encapsulation: {
          type: 'shadow',
          serializable: false
        }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'serializable')).toEqual(undefined);
    expect(t.cmp.shadowSerializable).toBe(false);
  });

  it('scoped does not support serializable', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        encapsulation: { type: 'scoped' }
      })
      export class CmpA {}
    `);

    expect(t.cmp.encapsulation).toBe('scoped');
    expect(t.cmp.shadowSerializable).toBe(false);
  });

  it('serializable alongside clonable and delegatesFocus', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        encapsulation: {
          type: 'shadow',
          delegatesFocus: true,
          clonable: true,
          serializable: true
        }
      })
      export class CmpA {}
    `);

    expect(t.cmp.shadowDelegatesFocus).toBe(true);
    expect(t.cmp.shadowClonable).toBe(true);
    expect(t.cmp.shadowSerializable).toBe(true);
  });
});
