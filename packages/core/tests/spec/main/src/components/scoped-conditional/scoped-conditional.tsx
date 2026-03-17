import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'scoped-conditional',
  scoped: true,
})
export class ScopedConditional {
  @Prop() renderHello: boolean = false;

  render() {
    return (
      <div>
        {/* prior to fixing the bug */}
        {/* - if you remove the conditional below, it works */}
        {/* - if you remove the <div /> around `.tag`, it works */}
        {/* - if you add additional elements between the conditional and the second <div/>, it works */}

        {/* Note: Need the conditional's first half, _and_ the innerHTML attr */}
        {/* Interestingly, if we replace innerHTML with a text node as a child of the <div>, */}
        {/* we get a separate error where the slot doesn't get put in the correct place */}
        {this.renderHello && <div class="tag" innerHTML={'Hello'} />}
        {/* This div below must be there too */}
        <div>
          before slot-&gt;
          <slot />
          &lt;-after slot
        </div>
      </div>
    );
  }
}
