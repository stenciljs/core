import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'global-script-test',
  scoped: true,
})
export class GlobalScriptTest {
  @State() renderTime?: number;
  @State() globalScriptTime?: number;

  componentWillLoad() {
    this.renderTime = Date.now();
    this.globalScriptTime = window.__globalScriptTimestamp;
  }

  render() {
    const elapsed =
      this.globalScriptTime && this.renderTime
        ? this.renderTime - this.globalScriptTime
        : undefined;

    return (
      <section>
        <div class='global-script-time'>{this.globalScriptTime ?? 'not set'}</div>
        <div class='render-time'>{this.renderTime}</div>
        <div class='elapsed'>{elapsed !== undefined ? elapsed : 'N/A'}</div>
      </section>
    );
  }
}
