import { Component, h } from '@stencil/core';

@Component({
  tag: 'auto-loader-dynamic',
  shadow: true,
})
export class AutoLoaderDynamic {
  render() {
    return (
      <div class="dynamic-loaded">
        <span>Dynamic Component Loaded</span>
        <auto-loader-child></auto-loader-child>
      </div>
    );
  }
}
