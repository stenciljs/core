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

  private boolStates = [];

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

  private jsonStates = [];
  private arrayStates = [];

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

  render() {
    return <div />;
  }
}
