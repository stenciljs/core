import type { MixedInCtor } from '@stencil/core';

// Cross-file mixin factory — no Stencil decorators, just a plain method.
export const WithSuffix = <B extends MixedInCtor>(Base: B) => {
  class Mixed extends Base {
    suffix = '!';
  }
  return Mixed;
};
