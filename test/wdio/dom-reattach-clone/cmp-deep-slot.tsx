import { Component, h } from '@stencil/core';

@Component({
  tag: 'dom-reattach-clone-deep-slot',
  scoped: true,
})
export class DomReattachCloneDeep {
  render() {
    return (
      <div class="wrapper">
        <span class="component-mark-up">Component mark-up</span>
        <div>
          <section>
            <slot></slot>
          </section>
        </div>
      </div>
    );
  }
}
