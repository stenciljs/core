import { Component, h } from '@stencil/core';

@Component({
  tag: 'cross-document-style',
  styles: `
    :host {
      color: rgb(255, 0, 0);
    }
  `,
  encapsulation: { type: 'shadow' },
})
export class CrossDocumentStyleTestCmp {
  render() {
    return (
      <section>
        <div>I am rendered in red!</div>
      </section>
    );
  }
}
