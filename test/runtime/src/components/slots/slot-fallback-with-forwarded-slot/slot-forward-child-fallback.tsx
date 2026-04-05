import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'slot-forward-child-fallback',
  encapsulation: { type: 'scoped' },
  styles: `
    :host {
      display: block;
    }
  `,
})
export class SlotForwardChildFallback {
  @Prop() label: string;

  render() {
    return (
      <Host>
        <div>
          <slot name='label'>{this.label}</slot>
        </div>
      </Host>
    );
  }
}
