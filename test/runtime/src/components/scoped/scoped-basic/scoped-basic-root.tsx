import { Component } from '@stencil/core';

@Component({
  tag: 'scoped-basic-root',
  encapsulation: { type: 'scoped' },
  styleUrls: {
    md: 'scoped-basic-root.css',
  },
})
export class ScopedBasicRoot {
  render() {
    return (
      <scoped-basic>
        <span>light</span>
      </scoped-basic>
    );
  }
}
