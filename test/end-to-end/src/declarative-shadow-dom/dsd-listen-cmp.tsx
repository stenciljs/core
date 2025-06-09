import { Component, Element, h, Host, Listen } from '@stencil/core';

@Component({
  tag: 'dsd-listen-cmp',
  styleUrl: 'dsd-listen-cmp.css',
  shadow: true,
})
export class MyWhateverComponent {
  @Element() hostElement: HTMLSlotElement;
  private slotRef: HTMLSlotElement;

  @Listen('keydown', { capture: true }) // Crashes, incorrect binding in hydrate index.js
  handleKeyPress(e: CustomEvent): void {
    e.stopPropagation();
    console.log(this.slotRef);
  }

  render() {
    return (
      <Host>
        <slot ref={(el: HTMLSlotElement) => (this.slotRef = el)}></slot>
      </Host>
    );
  }
}
