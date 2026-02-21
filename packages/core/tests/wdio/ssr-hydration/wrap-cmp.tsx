import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'wrap-ssr-shadow-cmp',
  shadow: true,
  styles: `
    :host {
      display: block;
      padding: 10px;
      border: 2px solid #000;
      background: blue;
      color: white;
    }
  `,
})
export class SsrWrapShadowCmp {
  @Prop() selected: boolean;

  render() {
    return (
      <div
        class={{
          selected: this.selected,
        }}
      >
        Nested component:
        <ssr-shadow-cmp>
          <slot />
        </ssr-shadow-cmp>
      </div>
    );
  }
}
