import { Component, h } from '@stencil/core';

@Component({
  tag: 'auto-loader-child',
  shadow: true,
})
export class AutoLoaderChild {
  render() {
    return (
      <div class="child-loaded">
        <span>Child Component Loaded</span>
      </div>
    );
  }
}
