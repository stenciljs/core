import { Component, h } from '@stencil/core';

@Component({ tag: 'my-lightdom-patches' })
export class MyLightdomPatches {
  render() {
    return (
      <div>
        Light DOM Patches Test
        <slot />
      </div>
    );
  }
}
