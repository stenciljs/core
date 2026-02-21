import { Component, h } from '@stencil/core';

/**
 * @virtualProp { 'buford' | 'griff'} mode - This is the mode
 */
@Component({
  tag: 'shadow-mode',
  shadow: true,
  styleUrls: {
    buford: 'shadow-mode.buford.scss',
    griff: 'shadow-mode.griff.css',
  },
})
export class ShadowMode {
  render() {
    return (
      <section>
        <slot></slot>
      </section>
    );
  }
}
