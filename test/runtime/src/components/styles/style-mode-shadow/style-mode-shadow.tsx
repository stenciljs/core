import { Component, h } from '@stencil/core';

/**
 * Tests style modes with shadow DOM.
 * Mode 'buford' = yellow background
 * Mode 'griff' = red background
 *
 * @virtualProp {'buford' | 'griff'} mode - The style mode
 */
@Component({
  tag: 'style-mode-shadow',
  shadow: true,
  styleUrls: {
    buford: 'style-mode-shadow.buford.css',
    griff: 'style-mode-shadow.griff.css',
  },
})
export class StyleModeShadow {
  render() {
    return (
      <section class='style-mode-content'>
        <slot></slot>
      </section>
    );
  }
}
