import { Build, Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'ssr-shadow-cmp',
  shadow: true,
  styles: `
    :host {
      display: block;
      padding: 10px;
      border: 2px solid #000;
      background: yellow;
      color: red;
    }
  `,
})
export class SsrShadowCmp {
  @Prop() selected: boolean;

  render() {
    return (
      <div
        class={{
          selected: this.selected,
        }}
      >
        <slot name="top" />
        <slot />
        {Build.isBrowser && <slot name="client-only" />}
      </div>
    );
  }
}
