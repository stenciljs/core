import { Component, h } from '@stencil/core';

@Component({
  tag: 'multiple-styles-cmp',
  /**
   * styles are intentionally duplicated to ensure that `foo.scss` can overwrite
   * `bar.scss` since it is set last in the `styleUrls` array.
   */
  styleUrls: ['foo.scss', 'bar.scss', 'foo.scss'],
  shadow: true,
})
export class SassCmp {
  render() {
    return (
      <main>
        <h1>Hello World</h1>
        <p>What's your name?</p>
      </main>
    );
  }
}
