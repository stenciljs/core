import { Component, h } from '@stencil/core';

@Component({
  tag: 'es5-addclass-svg',
  shadow: true,
})
export class SvgAddClass {
  render() {
    return (
      <div>
        <svg viewBox="0 0 8 8" class="existing-css-class">
          <circle cx="2" cy="2" width="64" height="64" r="2" />
        </svg>
      </div>
    );
  }
}
