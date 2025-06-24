import { transpileModule } from './transpile';

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
});
