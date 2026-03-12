import { Component, h, Prop } from '@stencil/core';

export type Item = {
  id: number;
  label: string;
  selected: boolean;
};

@Component({
  tag: 'scoped-add-remove-classes',
  scoped: true,
  styles: `
    .menu-item {
      padding: 8px 16px;
      cursor: pointer;
    }
    .menu-selected {
      background-color: #d17e7e;
    }
  `,
})
export class AddRemoveClasses {
  @Prop({ mutable: true }) selectedItems: number[];

  handleItemClick = (item: Item) => {
    this.selectedItems = [item.id];
  };

  @Prop() items: Item[];

  render() {
    return (
      <div class="menu">
        {this.items.map((item: Item) => (
          <div
            class={{
              'menu-item': true,
              'menu-selected': this.selectedItems.includes(item.id),
            }}
            onClick={() => this.handleItemClick(item)}
          >
            {item.label}
          </div>
        ))}
      </div>
    );
  }
}
