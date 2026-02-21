import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-c',
  shadow: true,
  styles: `
    :host {
      display: block;
      border: 5px solid blue;
    }
    article {
      border: 5px solid purple;
      padding: 5px;
      background: #eee;
      color: maroon;
    }
  `,
})
export class CmpC {
  componentWillLoad() {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('cmp-c componentWillLoad resolved');
        resolve();
      }, 1500);
    });
  }

  render() {
    return (
      <article>
        cmp-c, article, shadow-dom text top
        <slot></slot>
        cmp-c, article, shadow-dom text bottom
      </article>
    );
  }
}
