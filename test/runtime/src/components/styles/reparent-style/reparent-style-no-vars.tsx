import { Component, h } from '@stencil/core';

@Component({
  tag: 'reparent-style-no-vars',
  styleUrl: 'reparent-style-no-vars.css',
  encapsulation: { type: 'shadow' },
})
export class ReparentStyleNoVars {
  render() {
    return <div class='css-entry'>No CSS Variables</div>;
  }
}
