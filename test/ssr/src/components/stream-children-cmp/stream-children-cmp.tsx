import { Component, Element } from '@stencil/core';

/** Renders its light DOM child count, so hydrating before the children are parsed shows. */
@Component({
  tag: 'stream-children-cmp',
  encapsulation: { type: 'shadow' },
})
export class StreamChildrenCmp {
  @Element() el!: HTMLElement;

  render() {
    return (
      <div>
        <p>children: {this.el.children.length}</p>
        <slot></slot>
      </div>
    );
  }
}
