import { AttachInternals, Component, h, Method, Prop } from '@stencil/core';

@Component({
  tag: 'extends-form-associated-base',
  shadow: true,
  formAssociated: true,
})
export class ExtendsFormAssociatedBase {
  @AttachInternals() internals: ElementInternals;
  @Prop() value = '';

  @Method()
  async hasInternals() {
    return !!this.internals;
  }

  render() {
    return <input value={this.value} />;
  }
}
