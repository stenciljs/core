import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'slot-forward-child-fallback',
  scoped: true,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class ChildComponent {
  @Prop() label: string;

  render() {
    return (
      <Host>
        <div>
          <slot name="label">{this.label}</slot>
        </div>
      </Host>
    );
  }
}
