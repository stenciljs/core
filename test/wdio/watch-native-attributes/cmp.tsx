import { Component, Element, h, State, Watch } from '@stencil/core';

@Component({
  tag: 'watch-native-attributes',
})
export class WatchNativeAttributes {
  @Element() el!: HTMLElement;

  @State() callbackTriggered = false;

  @Watch('aria-label')
  onAriaLabelChange() {
    this.callbackTriggered = true;
  }

  render() {
    return [
      <p>Label: {this.el.getAttribute('aria-label')}</p>,
      <p>Callback triggered: {`${this.callbackTriggered}`}</p>,
    ];
  }
}
