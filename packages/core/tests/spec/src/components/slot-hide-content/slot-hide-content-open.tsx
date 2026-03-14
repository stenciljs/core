import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'slot-hide-content-open',
  scoped: false,
  shadow: false,
})
export class SlotHideContentOpen {
  @Prop() enabled = false;

  render() {
    return (
      <Host>
        <p>Test</p>
        {this.enabled && (
          <div class="slot-wrapper">
            <slot>
              <span>fallback default slot</span>
            </slot>
          </div>
        )}
      </Host>
    );
  }
}
