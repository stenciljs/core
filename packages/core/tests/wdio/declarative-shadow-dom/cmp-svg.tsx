import { Component, h } from '@stencil/core';

@Component({
  tag: 'custom-svg-element',
  shadow: true,
})
export class CustomSvgElement {
  render() {
    return (
      <svg viewBox="0 0 54 54">
        <circle cx="8" cy="18" width="54" height="8" r="2" />
      </svg>
    );
  }
}
