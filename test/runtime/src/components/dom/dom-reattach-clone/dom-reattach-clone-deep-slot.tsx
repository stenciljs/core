import { Component } from '@stencil/core';

@Component({
  tag: 'dom-reattach-clone-deep-slot',
  encapsulation: { type: 'scoped' },
})
export class DomReattachCloneDeep {
  render() {
    return (
      <div class='wrapper'>
        <span class='component-mark-up'>Component mark-up</span>
        <div>
          <section>
            <slot></slot>
          </section>
        </div>
      </div>
    );
  }
}
