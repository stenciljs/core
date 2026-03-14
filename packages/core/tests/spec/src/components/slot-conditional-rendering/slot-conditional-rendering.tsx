import { Component, h, Host, State } from '@stencil/core';

@Component({
  tag: 'slot-conditional-rendering',
  shadow: false,
  scoped: true,
})
export class SlotConditionalRendering {
  @State() headerVisible = true;
  @State() contentVisible = true;

  render() {
    return (
      <Host>
        {this.headerVisible ? <slot name="header" /> : null}
        {this.contentVisible ? <slot /> : null}

        <button id="header-visibility-toggle" onClick={() => (this.headerVisible = !this.headerVisible)}>
          Toggle header visibility (to {this.headerVisible ? 'hidden' : 'visible'})
        </button>
        <button id="content-visibility-toggle" onClick={() => (this.contentVisible = !this.contentVisible)}>
          Toggle content visibility (to {this.contentVisible ? 'hidden' : 'visible'})
        </button>
      </Host>
    );
  }
}
