import { Component, Host, h } from '@stencil/core';

/**
 * Component using closed shadow DOM mode for SSR testing.
 * With mode: 'closed', the shadowRoot is not accessible from outside,
 * but SSR should still serialize the shadow content correctly.
 */
@Component({
  tag: 'shadow-closed',
  encapsulation: { type: 'shadow', mode: 'closed' },
  styles: `
    :host {
      display: block;
      border: 3px solid purple;
      padding: 10px;
    }
    .closed-content {
      background: rgb(128, 0, 128);
      color: white;
      padding: 5px;
    }
  `,
})
export class ShadowClosed {
  render() {
    return (
      <Host>
        <div class='closed-content'>
          <strong>Closed Shadow DOM Content</strong>
        </div>
        <slot>
          <span>Fallback slot content</span>
        </slot>
      </Host>
    );
  }
}
