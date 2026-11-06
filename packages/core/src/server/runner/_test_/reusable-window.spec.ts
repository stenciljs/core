import { describe, expect, it } from 'vitest';

import { serializeShadowRootKey } from '../reusable-window';

describe('serializeShadowRootKey', () => {
  it('distinguishes the built-in modes', () => {
    const keys = [true, false, 'scoped', 'declarative-shadow-dom'].map(serializeShadowRootKey);
    expect(new Set(keys).size).toBe(4);
  });

  it('gives equivalent object configs the same key', () => {
    expect(
      serializeShadowRootKey({ default: 'scoped', 'declarative-shadow-dom': ['b-cmp', 'a-cmp'] }),
    ).toBe(
      serializeShadowRootKey({
        'declarative-shadow-dom': ['A-CMP', 'b-cmp', 'a-cmp'],
        default: 'scoped',
      }),
    );
  });

  it('treats a missing tag list like an empty one', () => {
    expect(serializeShadowRootKey({ default: 'scoped', scoped: [] })).toBe(
      serializeShadowRootKey({ default: 'scoped' }),
    );
  });

  it('distinguishes object configs that scope different components', () => {
    const keys = [
      { default: 'scoped' },
      { default: 'declarative-shadow-dom' },
      { default: 'declarative-shadow-dom', scoped: ['a-cmp'] },
      { default: 'declarative-shadow-dom', scoped: ['b-cmp'] },
      { default: 'scoped', 'declarative-shadow-dom': ['a-cmp'] },
    ].map(serializeShadowRootKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("doesn't confuse a tag list with the other list", () => {
    expect(serializeShadowRootKey({ default: 'scoped', scoped: ['a-cmp'] })).not.toBe(
      serializeShadowRootKey({ default: 'scoped', 'declarative-shadow-dom': ['a-cmp'] }),
    );
  });
});
