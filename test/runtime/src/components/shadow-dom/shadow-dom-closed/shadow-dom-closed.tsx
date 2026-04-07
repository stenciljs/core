import { Component, h, Element, Method, getShadowRoot } from '@stencil/core';

/**
 * Component using closed shadow DOM mode.
 * With mode: 'closed', the shadowRoot is not accessible from outside the component.
 */
@Component({
  tag: 'shadow-dom-closed',
  styles: `
    div {
      background: rgb(128, 0, 128);
      color: white;
      padding: 10px;
    }
  `,
  encapsulation: { type: 'shadow', mode: 'closed' },
})
export class ShadowDomClosed {
  @Element() el!: HTMLElement;

  /**
   * Method to verify internal shadow DOM access works.
   * Returns the text content of the internal div.
   */
  @Method()
  async getInternalText(): Promise<string> {
    const shadowRoot = getShadowRoot(this.el);
    if (shadowRoot) {
      const div = shadowRoot.querySelector('div');
      return div?.textContent || '';
    }
    return '';
  }

  /**
   * Method to check if styles are applied correctly.
   * Returns the computed background color of the internal div.
   */
  @Method()
  async getInternalBackgroundColor(): Promise<string> {
    const shadowRoot = getShadowRoot(this.el);
    if (shadowRoot) {
      const div = shadowRoot.querySelector('div');
      if (div) {
        return window.getComputedStyle(div).backgroundColor;
      }
    }
    return '';
  }

  render() {
    return (
      <div>
        <span>Closed Shadow DOM Content</span>
        <slot />
      </div>
    );
  }
}
