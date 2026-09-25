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

  // Regression coverage for https://github.com/stenciljs/core/issues/6854 - a prop named `aria`,
  // or any other name starting with `aria`, must still accept an object value from JSX. See
  // test.spec.tsx.
  @Prop() aria?: Record<string, string | boolean | undefined> | string;
  @Prop() ariaCustomThing?: Record<string, string | boolean | undefined> | string;

  @Method()
  async getInstance() {
    return this;
  }
}
