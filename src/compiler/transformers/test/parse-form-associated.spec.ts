import { transpileModule } from './transpile';

describe('parse form associated', function () {
  it('should set formAssociated if passed to decorator', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'cmp-a',
      formAssociated: true
    })
    export class CmpA {
    }
    `);
    expect(t.cmp!.formAssociated).toBe(true);
  });

  it('should not set formAssociated if not set', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'cmp-a',
    })
    export class CmpA {
    }
    `);
    expect(t.cmp!.formAssociated).toBe(false);
  });
});
