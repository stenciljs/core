import { Component } from '@stencil/core';

@Component({
  tag: 'cmp-scoped-b',
  styleUrl: 'cmp-scoped-b.css',
  encapsulation: { type: 'scoped' },
})
export class CmpScopedB {
  render() {
    return (
      <div>
        <p>cmp-scoped-b</p>
        <p class='scoped-class'>scoped-class</p>
      </div>
    );
  }
}
