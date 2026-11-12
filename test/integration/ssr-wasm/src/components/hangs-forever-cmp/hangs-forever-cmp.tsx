import { Component, h } from '@stencil/core';

/**
 * `componentWillLoad` awaits a Promise that never settles, to test how `renderToString()`
 * behaves under the `ssr-wasm` target when a component's hydration never settles on its own -
 * see ssr-wasm.e2e.ts.
 */
@Component({
  tag: 'hangs-forever-cmp',
  encapsulation: {
    type: 'shadow',
  },
})
export class HangsForeverCmp {
  componentWillLoad() {
    return new Promise<void>(() => {});
  }

  render() {
    return <div>hangs-forever-cmp</div>;
  }
}
