import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'part-wrap-ssr-shadow-cmp',
  shadow: true,
  styles: `
    :host {
      display: block;
      padding: 10px;
      border: 2px solid #000;
      background: blue;
      color: white;
    }
    part-ssr-shadow-cmp::part(container) {
      border: 2px solid red;
      background: pink;
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
        <part-ssr-shadow-cmp>
          <slot />
        </part-ssr-shadow-cmp>
      </div>
    );
  }
}
