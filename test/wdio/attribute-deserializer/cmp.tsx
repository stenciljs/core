import { AttrDeserialize, Component, h, Method, Prop, Watch } from '@stencil/core';

@Component({
  tag: 'attribute-deserializer',
})
export class AttributeDeserializer {
  // boolean

  @Prop() bool: boolean;

  @AttrDeserialize('bool')
  boolDeserialze(newVal: string | null) {
    if (newVal === null || newVal.match(/^(null|false|undefined)$/)) return false;
    return true;
  }

  private boolStates: boolean[] = [];

  @Watch('bool')
  boolWatcher(newVal: any) {
    this.boolStates.push(newVal);
  }

  @Method()
  async getBools() {
    return this.boolStates;
  }

  @Prop() array: string[];
  @Prop() json: { foo: string };
  @AttrDeserialize('json')
  @AttrDeserialize('array')
  jsonDeserialize(newVal: string) {
    try {
      return JSON.parse(newVal);
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
    this.getSetOrder.push('2.', v);
    this._getSet = v;
  }

  @AttrDeserialize('getSet')
  getSetDeserialize(newVal: string) {
    this.getSetOrder.push('1.', newVal);
    try {
      return JSON.parse(newVal);
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

  render() {
    return <div>testing</div>;
  }
}
