import { Component, Prop, h } from '@stencil/core';

/** Complex props with no serializer: fine on the server, but they don't reach the browser. */
@Component({
  tag: 'ssr-prop-cmp',
  encapsulation: { type: 'shadow' },
})
export class SsrPropCmp {
  @Prop() items: string[] = [];

  /** A multi-word name: its attribute is `extra-items`. */
  @Prop() extraItems: string[] = [];

  @Prop() label: string;

  render() {
    return (
      <ul>
        {[...this.items, ...this.extraItems].map((item) => (
          <li>{item}</li>
        ))}
      </ul>
    );
  }
}
