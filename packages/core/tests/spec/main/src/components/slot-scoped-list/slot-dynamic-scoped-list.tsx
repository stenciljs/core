import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'slot-dynamic-scoped-list',
  scoped: true,
})
export class DynamicListScopedComponent {
  @Prop() items: Array<string> = [];

  render() {
    return (
      <slot-light-scoped-list>
        {this.items.map((item) => (
          <div>{item}</div>
        ))}
      </slot-light-scoped-list>
    );
  }
}
