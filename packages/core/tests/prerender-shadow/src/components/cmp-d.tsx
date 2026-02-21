import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-d',
  shadow: true,
  styleUrl: 'cmp-d.css',
})
export class CmpD {
  componentWillLoad() {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('cmp-d componentWillLoad resolved');
        resolve();
      }, 1500);
    });
  }

  render() {
    return (
      <section>
        <div>
          <slot></slot>
        </div>
      </section>
    );
  }
}
