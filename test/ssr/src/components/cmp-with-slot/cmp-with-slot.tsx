import { Component } from '@stencil/core';

@Component({
  tag: 'cmp-with-slot',
  encapsulation: { type: 'shadow' },
})
export class ServerVSClientCmp {
  render() {
    return (
      <div>
        <div>
          <div>
            <slot></slot>
          </div>
        </div>
      </div>
    );
  }
}
