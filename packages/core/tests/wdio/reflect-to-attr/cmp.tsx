import { Component, Element, Prop } from '@stencil/core';

@Component({
  tag: 'reflect-to-attr',
})
export class ReflectToAttr {
  @Element() el!: any;

  @Prop({ reflect: true }) str = 'single';
  @Prop({ reflect: true }) nu = 2;
  @Prop({ reflect: true }) undef?: string;
  @Prop({ reflect: true }) null: string | null = null;
  @Prop({ reflect: true }) bool = false;
  @Prop({ reflect: true }) otherBool = true;
  @Prop({ reflect: true }) disabled = false;

  @Prop({ reflect: true, mutable: true }) dynamicStr?: string;
  @Prop({ reflect: true }) dynamicNu?: number;

  componentDidLoad() {
    this.dynamicStr = 'value';
    this.el.dynamicNu = 123;
  }
}
