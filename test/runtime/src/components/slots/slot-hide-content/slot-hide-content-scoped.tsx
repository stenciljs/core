import { Component, Host, Prop } from '@stencil/core';

@Component({
  tag: 'slot-hide-content-scoped',
  encapsulation: { type: 'scoped' },
})
export class SlotHideContentScoped {
  @Prop() enabled = false;

  render() {
    return (
      <Host>
        <p>Test</p>
        {this.enabled && (
          <div class='slot-wrapper'>
            <slot>
              <span>fallback default slot</span>
            </slot>
          </div>
        )}
      </Host>
    );
  }
}
