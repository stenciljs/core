import { describe, expect, it } from 'vitest';

import { CMP_FLAGS, formatComponentRuntimeMeta } from '../../../utils';
import { getStaticGetter, transpileModule } from './transpile';

describe('parse referenceTarget', () => {
  it('shadow without referenceTarget', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        encapsulation: { type: 'shadow' }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'referenceTarget')).toEqual(undefined);
    expect(t.cmp.shadowReferenceTarget).toBe(null);
    expect(formatComponentRuntimeMeta(t.cmp, true)[7]).toBe(undefined);
  });

  it('referenceTarget set', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a',
        encapsulation: {
          type: 'shadow',
          delegatesFocus: true,
          referenceTarget: ' internal-input '
        }
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'referenceTarget')).toEqual('internal-input');
    expect(t.cmp.shadowReferenceTarget).toBe('internal-input');
    expect(t.cmp.shadowDelegatesFocus).toBe(true);

    const compact = formatComponentRuntimeMeta(t.cmp, true);
    expect(compact[0] & CMP_FLAGS.shadowDelegatesFocus).toBeTruthy();
    expect(compact[7]).toBe('internal-input');
  });

  it('should throw error for empty referenceTarget', () => {
    expect(() =>
      transpileModule(`
        @Component({
          tag: 'cmp-a',
          encapsulation: {
            type: 'shadow',
            referenceTarget: '  '
          }
        })
        export class CmpA {}
      `),
    ).toThrow('The "referenceTarget" option must be a non-empty string');
  });
});
