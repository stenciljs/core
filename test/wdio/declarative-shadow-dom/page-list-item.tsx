import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'page-list-item',
  styleUrl: 'page-list-item.css',
  shadow: true,
})
export class MyOtherComponent {
  /**
   * Set the number to be displayed.
   */
  @Prop() label!: number;

  /**
   * Set the number to be displayed.
   */
  @Prop() active = false;

  render() {
    const paginationItemClass: any = {
      'pagination-item': true,
      active: this.active,
    };

    return (
      <div>
        <div class={paginationItemClass}>{this.label}</div>
      </div>
    );
  }
}
