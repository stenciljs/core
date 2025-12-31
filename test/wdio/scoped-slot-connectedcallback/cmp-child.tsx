import { Component, Element, h } from '@stencil/core';

@Component({
  tag: 'scoped-slot-connectedcallback-child',
  shadow: false,
})
export class ScopedSlotConnectedCallbackChild {
  @Element() el: HTMLElement;

  connectedCallback() {
    // Check if slotted content is available in connectedCallback
    const slottedContent = this.el.querySelector('#slotted-content');
    if (slottedContent) {
      this.el.setAttribute('data-connected-slot-available', 'true');
    } else {
      this.el.setAttribute('data-connected-slot-available', 'false');
    }
  }

  componentWillLoad() {
    // Also check in componentWillLoad for comparison
    const slottedContent = this.el.querySelector('#slotted-content');
    if (slottedContent) {
      this.el.setAttribute('data-willload-slot-available', 'true');
    } else {
      this.el.setAttribute('data-willload-slot-available', 'false');
    }
  }

  render() {
    return (
      <div class="wrapper">
        Before slot | <slot /> | After slot
      </div>
    );
  }
}
