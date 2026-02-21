import { Component, Method, Prop } from '@stencil/core';

import { SomeTypes } from '../util.js';

@Component({
  tag: 'attribute-complex',
})
export class AttributeComplex {
  @Prop() nu0 = 1;
  @Prop() nu1?: number;
  @Prop() nu2?: SomeTypes.Number;

  @Prop() bool0 = true;
  @Prop() bool1?: boolean;
  @Prop() bool2?: boolean;

  @Prop() str0 = 'hello';
  @Prop() str1?: string;
  @Prop() str2?: SomeTypes.String;

  private _obj = { name: 'James bond' };
  @Prop()
  get obj() {
    return JSON.stringify(this._obj);
  }
  set obj(newVal: string) {
    if (typeof newVal === 'string') {
      this._obj = { name: newVal };
    }
  }

  @Method()
  async getInstance() {
    return this;
  }
}
