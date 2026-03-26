import { Component, h } from '@stencil/core';

/**
 * Tests style modes with scoped CSS.
 * Mode 'buford' = limegreen background
 * Mode 'griff' = plum background
 *
 * @virtualProp {'buford' | 'griff'} mode - The style mode
 */
@Component({
  tag: 'style-mode-scoped',
  scoped: true,
  styleUrls: {
    buford: 'style-mode-scoped.buford.css',
    griff: 'style-mode-scoped.griff.css',
  },
})
export class StyleModeScoped {
  render() {
    return (
      <section class='style-mode-content'>
        <slot></slot>
      </section>
    );
  }
}
