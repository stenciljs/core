import { Component, Prop } from '@stencil/core';

@Component({
  tag: 'attribute-boolean',
})
export class AttributeBoolean {
  @Prop({ reflect: true }) boolState?: boolean;
  @Prop({ reflect: true }) strState?: string;
  @Prop() noreflect?: boolean;
}
