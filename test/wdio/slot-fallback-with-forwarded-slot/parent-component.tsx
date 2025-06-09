import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'slot-forward-root',
  scoped: true,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class MyComponent {
  @Prop() label: string;

  render() {
    return (
      <Host>
        <slot-forward-child-fallback label={this.label}>
          <slot name="label" />
        </slot-forward-child-fallback>
      </Host>
    );
  }
}
