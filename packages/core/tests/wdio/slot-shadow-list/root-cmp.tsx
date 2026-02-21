import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'slot-list-light-root',
})
export class SlotListLightRoot {
  @Prop({ mutable: true })
  items: string[] = [];

  needMore() {
    const newItems = [
      `Item ${this.items.length + 1}`,
      `Item ${this.items.length + 2}`,
      `Item ${this.items.length + 3}`,
      `Item ${this.items.length + 4}`,
    ];

    this.items = [...this.items, ...newItems];
  }

  render() {
    return (
      <div>
        <button onClick={() => this.needMore()}>More</button>
        <slot-dynamic-shadow-list items={this.items} />
      </div>
    );
  }
}
