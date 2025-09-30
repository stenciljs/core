import { Component, h, Method, Prop, PropSerialize, Watch } from '@stencil/core';

@Component({
  tag: 'prop-serializer',
})
export class PropSerializer {
  // boolean

  @Prop() boolOrSomething: boolean | string | number;

  @PropSerialize('boolOrSomething')
  boolOrSomethingSerialize(newVal: any) {
    if (newVal === false || newVal === 'false' || newVal === 0 || newVal === '0') {
      return null;
    }
    if (newVal) return newVal.toString();
  }

  private boolStates: (boolean | string | number)[] = [];

  @Watch('boolOrSomething')
  boolWatcher(newVal: any) {
    this.boolStates.push(newVal);
  }

  @Method()
  async getBools() {
    return this.boolStates;
  }

  // non-reflect
  @Prop({ reflect: false }) nonReflect: string;
  @PropSerialize('nonReflect')
  nonReflectSerialize(newVal: any) {
    // should never be called
    return newVal ? newVal.toString().toUpperCase() : null;
  }

  // array / json

  @Prop() array: string[];
  @Prop() json: { foo: string };
  @PropSerialize('json')
  @PropSerialize('array')
  jsonSerialize(newVal: any) {
    try {
      return JSON.stringify(newVal);
    } catch (e) {
      return null;
    }
  }

  private jsonStates: any = [];
  private arrayStates: any = [];

  @Watch('array')
  @Watch('json')
  arrayAndJsonWatcher(newVal: any, _old: any, propName: string) {
    if (propName === 'array') this.arrayStates.push(newVal);
    if (propName === 'json') this.jsonStates.push(newVal);
  }

  @Method()
  async getJson() {
    return this.jsonStates;
  }

  @Method()
  async getArray() {
    return this.arrayStates;
  }

  private getSetOrder: any[] = [];

  private _getSet: { [key: string]: string } = { moo: 'bar' };
  @Prop()
  get getSet() {
    return this._getSet;
  }
  set getSet(v: { [key: string]: string }) {
    this.getSetOrder.push('1.', v);
    this._getSet = v;
  }

  @PropSerialize('getSet')
  getSetSerialize(newVal: any) {
    this.getSetOrder.push('2.', newVal);
    try {
      return JSON.stringify(newVal);
    } catch (e) {
      return null;
    }
  }

  @Watch('getSet')
  getSetWatcher(newVal: any) {
    this.getSetOrder.push('3.', newVal);
  }

  @Method()
  async getGetSet() {
    return this.getSetOrder;
  }

  @Method()
  async reset() {
    this.boolStates = [];
    this.jsonStates = [];
    this.arrayStates = [];
    this.getSetOrder = [];
  }

  render() {
    return <div>testing</div>;
  }
}
