import { Component, h } from '@stencil/core';

@Component({
  tag: 'dom-api',
  assetsDirs: ['assets-b'],
})
export class DomApiCmp {
  render() {
    return (
      <span data-z="z" class="red green blue" data-a="a">
        dom api
      </span>
    );
  }
}
