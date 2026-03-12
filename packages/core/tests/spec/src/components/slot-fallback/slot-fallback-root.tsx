import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'slot-fallback-root',
})
export class SlotFallbackRoot {
  @State() fallbackInc = 0;
  @State() inc = 0;
  @State() slotContent = 'slot light dom 0';
  contentInc = 0;

  changeLightDom() {
    this.inc++;
  }

  changeSlotContent() {
    this.contentInc++;
    this.slotContent = 'slot light dom ' + this.contentInc;
  }

  changeFallbackContent() {
    this.fallbackInc++;
  }

  render() {
    return [
      <button onClick={this.changeFallbackContent.bind(this)} class="change-fallback-content">
        Change Fallback Slot Content
      </button>,

      <button onClick={this.changeLightDom.bind(this)} class="change-light-dom">
        {this.inc % 2 === 0 ? 'Use light dom content' : 'Use fallback slot content'}
      </button>,

      <button onClick={this.changeSlotContent.bind(this)} class="change-slot-content">
        Change Slot Content
      </button>,

      <slot-fallback inc={this.fallbackInc} class="results1">
        {this.inc % 2 !== 0
          ? [
              <content-default>{this.slotContent} : default</content-default>,
              <content-end slot="end">{this.slotContent} : end</content-end>,
              <content-start slot="start">{this.slotContent} : start</content-start>,
            ]
          : null}
      </slot-fallback>,
    ];
  }
}
