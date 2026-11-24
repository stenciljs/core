import { AttachInternals, Component, Prop } from '@stencil/core';

@Component({
  tag: 'form-associated-reflect',
  encapsulation: { type: 'shadow' },
})
export class FormAssociatedReflect {
  @AttachInternals() internals: ElementInternals;

  @Prop({ reflect: true }) disabled = false;

  render() {
    return <slot />;
  }
}
