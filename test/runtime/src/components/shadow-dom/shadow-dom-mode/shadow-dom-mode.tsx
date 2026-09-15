import { Component, getMode } from '@stencil/core';

/**
 * @virtualProp {string} colormode - The mode determines which platform styles to use.
 */
@Component({
  tag: 'shadow-dom-mode',
  styleUrls: {
    blue: 'mode-blue.css',
    red: 'mode-red.css',
  },
  encapsulation: { type: 'shadow' },
})
export class ShadowDomMode {
  private mode = getMode(this);

  render() {
    return <div>{this.mode}</div>;
  }
}
