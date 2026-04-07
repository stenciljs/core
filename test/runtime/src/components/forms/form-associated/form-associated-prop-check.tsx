import { Component, h, Prop, AttachInternals } from '@stencil/core';

@Component({
  tag: 'form-associated-prop-check',
  encapsulation: { type: 'shadow' },
})
export class FormAssociatedPropCheck {
  @AttachInternals() internals: ElementInternals;

  @Prop() disabled: boolean;

  render() {
    return (
      <div style={{ cursor: 'pointer', padding: '10px', border: '1px solid #ccc' }}>
        <p>Disabled prop value: {String(this.disabled)}</p>
      </div>
    );
  }
}
