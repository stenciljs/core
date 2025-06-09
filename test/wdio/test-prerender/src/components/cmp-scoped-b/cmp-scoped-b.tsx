import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-scoped-b',
  styleUrl: 'cmp-scoped-b.css',
  scoped: true,
})
export class CmpScopedB {
  render() {
    return (
      <div>
        <p>cmp-scoped-b</p>
        <p class="scoped-class">scoped-class</p>
      </div>
    );
  }
}
