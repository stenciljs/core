import { Component, h, Prop } from '@stencil/core';

@Component({
  @AttachInternals() internals: ElementInternals;

  tag: 'form-associated-prop-check',
  shadow: true,
  
})
export class FormAssociatedPropCheck {
  @Prop() disabled: boolean;

  render() {
    return (
      <div style={{ cursor: 'pointer', padding: '10px', border: '1px solid #ccc' }}>
        <p>Disabled prop value: {String(this.disabled)}</p>
      </div>
    );
  }
}
