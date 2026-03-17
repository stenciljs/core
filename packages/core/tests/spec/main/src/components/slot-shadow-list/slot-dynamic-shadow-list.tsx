import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'slot-dynamic-shadow-list',
  shadow: true,
})
export class DynamicListShadowComponent {
  @Prop() items: Array<string> = [];

  render() {
    return (
      <slot-light-list>
        {this.items.map((item) => (
          <div>{item}</div>
        ))}
      </slot-light-list>
    );
  }
}
