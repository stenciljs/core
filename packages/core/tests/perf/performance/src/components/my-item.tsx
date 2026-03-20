import { Component, Host, h, Prop } from '@stencil/core';

@Component({
  tag: 'my-item',
  shadow: true,
})
export class MyItem {
  @Prop() index = 0;

  render() {
    return (
      <Host
        role="item"
        class={{
          [`item-class-one-${this.index}`]: true,
          [`item-class-two-${this.index}`]: true,
          [`item-class-three-${this.index}`]: true,
          [`item-class-four-${this.index}`]: true,
          [`item-class-five-${this.index}`]: true,
          [`item-class-six-${this.index}`]: true,
          [`item-class-seven-${this.index}`]: true,
        }}
      >
        [Start{this.index}]
        <div data-index={this.index}>
          <slot></slot>
        </div>
        [End{this.index}] Hello World
      </Host>
    );
  }
}
