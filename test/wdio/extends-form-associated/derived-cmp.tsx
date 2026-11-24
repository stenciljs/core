import { Component, Prop } from '@stencil/core';

import { ExtendsFormAssociatedBase } from './base-cmp';

@Component({
  tag: 'extends-form-associated-derived',
  shadow: true,
  formAssociated: true,
})
export class ExtendsFormAssociatedDerived extends ExtendsFormAssociatedBase {
  @Prop() value = 'derived';
}
