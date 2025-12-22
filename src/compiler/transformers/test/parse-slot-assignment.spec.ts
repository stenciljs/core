import { getStaticGetter, transpileModule } from './transpile';

describe('parse slotAssignment', () => {
  it('shadow without slotAssignment', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        shadow: true
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toEqual('shadow');
    expect(getStaticGetter(t.outputText, 'slotAssignment')).toEqual(undefined);

    expect(t.cmp.encapsulation).toBe('shadow');
    expect(t.cmp.slotAssignment).toBe(null);
  });

  it('slotAssignment manual', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        shadow: {
          slotAssignment: 'manual'
        }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toEqual('shadow');
    expect(getStaticGetter(t.outputText, 'slotAssignment')).toEqual('manual');

    expect(t.cmp.encapsulation).toBe('shadow');
    expect(t.cmp.slotAssignment).toBe('manual');
  });

  it('slotAssignment named (explicit)', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        shadow: {
          slotAssignment: 'named'
        }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toEqual('shadow');
    expect(getStaticGetter(t.outputText, 'slotAssignment')).toEqual(undefined);

    expect(t.cmp.encapsulation).toBe('shadow');
    expect(t.cmp.slotAssignment).toBe(null);
  });

  it('slotAssignment manual with delegatesFocus', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        shadow: {
          delegatesFocus: true,
          slotAssignment: 'manual'
        }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toEqual('shadow');
    expect(getStaticGetter(t.outputText, 'delegatesFocus')).toEqual(true);
    expect(getStaticGetter(t.outputText, 'slotAssignment')).toEqual('manual');

    expect(t.cmp.encapsulation).toBe('shadow');
    expect(t.cmp.shadowDelegatesFocus).toBe(true);
    expect(t.cmp.slotAssignment).toBe('manual');
  });

  it('scoped does not support slotAssignment', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        scoped: true
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'encapsulation')).toEqual('scoped');
    expect(getStaticGetter(t.outputText, 'slotAssignment')).toEqual(undefined);

    expect(t.cmp.encapsulation).toBe('scoped');
    expect(t.cmp.slotAssignment).toBe(null);
  });

  it('no encapsulation does not support slotAssignment', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a'
      })
      export class CmpA {}
    `);

    expect(t.outputText).not.toContain(`static get encapsulation()`);
    expect(getStaticGetter(t.outputText, 'slotAssignment')).toEqual(undefined);

    expect(t.cmp.encapsulation).toBe('none');
    expect(t.cmp.slotAssignment).toBe(null);
  });

  it('should throw error for invalid slotAssignment value', () => {
    let error: Error | undefined;
    try {
      transpileModule(`
        @Component({
          tag: 'cmp-a',
          shadow: {
            slotAssignment: 'invalid'
          }
        })
        export class CmpA {}
      `);
    } catch (err: unknown) {
      error = err as Error;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain('The "slotAssignment" option must be either "manual" or "named".');
  });
});
