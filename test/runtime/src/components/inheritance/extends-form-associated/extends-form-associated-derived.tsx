import { Component, Prop } from '@stencil/core';

import { ExtendsFormAssociatedBase } from './extends-form-associated-base';

@Component({
  tag: 'extends-form-associated-derived',
  encapsulation: { type: 'shadow' },
})
export class ExtendsFormAssociatedDerived extends ExtendsFormAssociatedBase {
  @Prop() value = 'derived';
}
