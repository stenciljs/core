import { Element, Prop } from '@stencil/core';

export class ElementBase {
  @Element() el!: HTMLElement;
  @Prop() label = 'base';

  /** Reads the element ref from base class code. */
  get baseTagName() {
    return this.el?.tagName.toLowerCase();
  }
}
