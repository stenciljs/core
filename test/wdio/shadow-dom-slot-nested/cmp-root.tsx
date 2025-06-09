import { Component, h } from '@stencil/core';

@Component({
  tag: 'shadow-dom-slot-nested-root',
  styles: `
    :host {
      color: green;
      font-weight: bold;
    }
  `,
  shadow: true,
})
export class ShadowDomSlotNestedRoot {
  render() {
    const nested = [0, 1, 2].map((i) => {
      return <shadow-dom-slot-nested i={i}>light dom: {i}</shadow-dom-slot-nested>;
    });

    return [<section>shadow-dom-slot-nested</section>, <article>{nested}</article>];
  }
}
