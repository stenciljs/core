import { Component, h } from '@stencil/core';

@Component({
  tag: 'auto-loader-root',
  shadow: true,
})
export class AutoLoaderRoot {
  render() {
    return (
      <div class="root-loaded">
        <span>Root Component Loaded</span>
      </div>
    );
  }
}
