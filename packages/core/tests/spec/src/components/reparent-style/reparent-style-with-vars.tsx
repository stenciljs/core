import { Component, h } from '@stencil/core';

@Component({
  tag: 'reparent-style-with-vars',
  styleUrl: 'reparent-style-with-vars.css',
  shadow: true,
})
export class ReparentStyleWithVars {
  render() {
    return <div class="css-entry">With CSS Vars</div>;
  }
}
