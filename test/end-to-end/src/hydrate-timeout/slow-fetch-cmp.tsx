import { Component, Prop, h } from '@stencil/core';

/**
 * Used by hydrate-timeout.e2e.ts to reproduce stenciljs/core#6864: a
 * component whose `componentWillLoad` is still awaiting `fetch()` when the
 * render's `opts.timeout` fires.
 */
@Component({
  tag: 'slow-fetch-cmp',
  shadow: true,
})
export class SlowFetchCmp {
  @Prop() url: string;

  async componentWillLoad() {
    try {
      await fetch(this.url);
    } catch (e) {
      // expected once the render times out and aborts this request
    }
  }

  render() {
    return <div>slow-fetch-cmp</div>;
  }
}
