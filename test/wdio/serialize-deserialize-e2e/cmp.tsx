import { AttrDeserialize, Build, Component, h, Method, Prop, PropSerialize, Watch } from '@stencil/core';

@Component({
  tag: 'serialize-deserializer',
})
export class PropSerializer {
  async componentWillLoad() {
    if (Build.isBrowser) return;
    // server-side, set the initial values ... e.g. we did some server fetching
    this.array = ['a', 'b', 'c'];
    this.getSet = { foo: 'bar' };
  }

  private arrayStates: any = [];
  @Prop() array: string[];

  @PropSerialize('array')
  arraySerialize(newVal: any) {
    if (Build.isBrowser) return null;
    try {
      return JSON.stringify(newVal);
    } catch (e) {
      return null;
    }
  }
  @AttrDeserialize('array')
  arrayDeserialize(newVal: string) {
    try {
      return JSON.parse(newVal);
    } catch (e) {
      return null;
    }
  }

  @Watch('array')
  arrayAndJsonWatcher(newVal: any) {
    this.arrayStates.push(newVal);
  }

  @Method()
  async getArray() {
    return this.arrayStates;
  }

  private getSetOrder: any[] = [];

  private _getSet: { [key: string]: string };
  @Prop({ reflect: true })
  get getSet() {
    return this._getSet;
  }
  set getSet(v: { [key: string]: string }) {
    this.getSetOrder.push('setter.', v);
    this._getSet = v;
  }

  @PropSerialize('getSet')
  getSetSerialize(newVal: any) {
    if (Build.isBrowser) return null;
    this.getSetOrder.push('serialize.', newVal);
    // server-side, let's stringify the value to the attribute
    try {
      return JSON.stringify(newVal);
    } catch (e) {
      return null;
    }
  }

  @AttrDeserialize('getSet')
  getSetDeserialize(newVal: string) {
    this.getSetOrder.push('deserialize.', newVal);
    try {
      return JSON.parse(newVal);
    } catch (e) {
      return null;
    }
  }

  @Watch('getSet')
  getSetWatcher(newVal: any) {
    this.getSetOrder.push('watcher.', newVal);
  }

  @Method()
  async getGetSet() {
    return this.getSetOrder;
  }

  @Method()
  async reset() {
    this.arrayStates = [];
    this.getSetOrder = [];
  }

  render() {
    return <div>testing</div>;
  }
}
