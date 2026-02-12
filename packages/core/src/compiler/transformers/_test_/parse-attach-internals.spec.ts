import { transpileModule } from './transpile';
import { describe, expect, it } from 'vitest';

describe('parse attachInternals', function () {
  it('should set attachInternalsMemberName when set', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'cmp-a',
      formAssociated: true
    })
    export class CmpA {
      @AttachInternals()
      myProp;
    }
    `);
    expect(t.cmp!.formAssociated).toBe(true);
    expect(t.cmp!.attachInternalsMemberName).toBe('myProp');
  });

  it('should not set attachInternalsMemberName if not set', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'cmp-a',
    })
    export class CmpA {
    }
    `);
    expect(t.cmp!.attachInternalsMemberName).toBe(null);
  });

  it('should set attachInternalsMemberName even if formAssociated is not defined', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'cmp-a',
    })
    export class CmpA {
      @AttachInternals()
      myProp;
    }
    `);
    expect(t.cmp!.formAssociated).toBe(false);
    expect(t.cmp!.attachInternalsMemberName).toBe('myProp');
  });

  it('should set attachInternalsMemberName even if formAssociated is false', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'cmp-a',
      formAssociated: false
    })
    export class CmpA {
      @AttachInternals()
      myProp;
    }
    `);
    expect(t.cmp!.formAssociated).toBe(false);
    expect(t.cmp!.attachInternalsMemberName).toBe('myProp');
  });

  it('should parse custom states from decorator options', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'cmp-a',
    })
    export class CmpA {
      @AttachInternals({ states: { open: true, active: false, disabled: false } })
      internals;
    }
    `);
    expect(t.cmp!.attachInternalsMemberName).toBe('internals');
    expect(t.cmp!.attachInternalsCustomStates).toEqual([
      { name: 'open', initialValue: true, docs: '' },
      { name: 'active', initialValue: false, docs: '' },
      { name: 'disabled', initialValue: false, docs: '' },
    ]);
  });

  it('should handle @AttachInternals without options (backward compat)', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'cmp-a',
    })
    export class CmpA {
      @AttachInternals()
      internals;
    }
    `);
    expect(t.cmp!.attachInternalsMemberName).toBe('internals');
    expect(t.cmp!.attachInternalsCustomStates).toEqual([]);
  });

  it('should handle @AttachInternals with empty states object', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'cmp-a',
    })
    export class CmpA {
      @AttachInternals({ states: {} })
      internals;
    }
    `);
    expect(t.cmp!.attachInternalsMemberName).toBe('internals');
    expect(t.cmp!.attachInternalsCustomStates).toEqual([]);
  });

  it('should handle @AttachInternals with states and formAssociated', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'cmp-a',
      formAssociated: true
    })
    export class CmpA {
      @AttachInternals({ states: { checked: true } })
      internals;
    }
    `);
    expect(t.cmp!.formAssociated).toBe(true);
    expect(t.cmp!.attachInternalsMemberName).toBe('internals');
    expect(t.cmp!.attachInternalsCustomStates).toEqual([{ name: 'checked', initialValue: true, docs: '' }]);
  });

  it('should parse JSDoc comments from state properties', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'cmp-a',
    })
    export class CmpA {
      @AttachInternals({
        states: {
          hovered: false,
          /** Whether is currently active */
          active: true
        }
      })
      internals;
    }
    `);
    expect(t.cmp!.attachInternalsMemberName).toBe('internals');
    expect(t.cmp!.attachInternalsCustomStates).toEqual([
      { name: 'hovered', initialValue: false, docs: '' },
      { name: 'active', initialValue: true, docs: 'Whether is currently active' },
    ]);
  });
});
