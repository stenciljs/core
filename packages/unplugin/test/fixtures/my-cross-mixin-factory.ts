import { Prop } from '@stencil/core';
import type { MixedInCtor } from '@stencil/core';

// Cross-file mixin factories, each contributing a decorated @Prop — combined
// via Mixin(WithPrefix, WithSuffix) in my-cross-mixin-cmp.tsx to exercise the
// resolveImport-based transpile path's multi-argument Mixin(...) support.
export const WithPrefix = <B extends MixedInCtor>(Base: B) => {
  class WithPrefixMixin extends Base {
    @Prop() prefix: string = '';
  }
  return WithPrefixMixin;
};

export const WithSuffix = <B extends MixedInCtor>(Base: B) => {
  class WithSuffixMixin extends Base {
    @Prop() suffix: string = '!';
  }
  return WithSuffixMixin;
};
