import { describe, expect, it } from 'vitest';

import { transpileModule } from './transpile';

describe('parse form associated', function () {
  it('should set formAssociated if @AttachInternals is used', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'cmp-a',
    })
    export class CmpA {
      @AttachInternals() internals;
    }
    `);
    expect(t.cmp!.formAssociated).toBe(true);
  });

  it('should not set formAssociated if @AttachInternals is not used', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'cmp-a',
    })
    export class CmpA {
    }
    `);
    expect(t.cmp!.formAssociated).toBe(false);
  });

  it('should allow opting out of formAssociated with @AttachInternals({ formAssociated: false })', async () => {
    const t = transpileModule(`
    @Component({
      tag: 'cmp-a',
    })
    export class CmpA {
      @AttachInternals({ formAssociated: false }) internals;
    }
    `);
    expect(t.cmp!.formAssociated).toBe(false);
    expect(t.cmp!.attachInternalsMemberName).toBe('internals');
  });
});
