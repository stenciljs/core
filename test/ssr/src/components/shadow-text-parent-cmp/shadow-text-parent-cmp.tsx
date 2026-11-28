import { Component, Prop, h } from '@stencil/core';

/**
 * A shadow component that renders non-shadow children with slotted text from its own template:
 * the text is the shadow component's content, slotted into a scoped child
 * (`scoped-ssr-child-cmp`) and an unencapsulated one (`plain-slot-cmp`).
 */
@Component({
  tag: 'shadow-text-parent-cmp',
  encapsulation: { type: 'shadow' },
})
export class ShadowTextParentCmp {
  @Prop() text = 'slotted text';

  render() {
    return (
      <div>
        <scoped-ssr-child-cmp>{this.text}</scoped-ssr-child-cmp>
        <plain-slot-cmp>{this.text}</plain-slot-cmp>
      </div>
    );
  }
}
