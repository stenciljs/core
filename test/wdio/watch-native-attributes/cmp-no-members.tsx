import { Component, Element, forceUpdate, h, Watch } from '@stencil/core';

@Component({
  tag: 'watch-native-attributes-no-members',
})
export class WatchNativeAttributesNoMembers {
  @Element() el!: HTMLElement;

  private callbackTriggered = false;

  @Watch('aria-label')
  onAriaLabelChange() {
    this.callbackTriggered = true;
    forceUpdate(this);
  }

  render() {
    return [
      <p>Label: {this.el.getAttribute('aria-label')}</p>,
      <p>Callback triggered: {`${this.callbackTriggered}`}</p>,
    ];
  }
}
