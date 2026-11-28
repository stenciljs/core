import { Prop } from '@stencil/core';

import { Validator } from './input-types.js';

// Base class in a different directory to the extending component, so both
// the re-anchoring and reclassification fixes are exercised: `size` and
// `disabled` need real complexType info instead of the type-blind decorator
// walk, and `validator` needs its import path re-anchored relative to
// my-input.tsx instead of this file.
export class BaseInput {
  @Prop() size: number = 0;
  @Prop() disabled: boolean = false;
  @Prop() validator: Validator;
}
