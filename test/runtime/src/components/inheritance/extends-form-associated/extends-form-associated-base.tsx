import { AttachInternals, Component, Method, Prop } from '@stencil/core';

@Component({
  tag: 'extends-form-associated-base',
  encapsulation: { type: 'shadow' },
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
