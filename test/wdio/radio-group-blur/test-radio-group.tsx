import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'test-radio-group',
  // Note: no shadow: true, this is key to reproducing the issue
})
export class TestRadioGroup {
  private onClick = (ev: Event) => {
    ev.preventDefault();
    // This click handler interaction with slot might be related to the issue
  };

  render() {
    return (
      <Host role="radiogroup" onClick={this.onClick}>
        <slot></slot>
      </Host>
    );
  }
}
