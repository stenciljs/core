import { h, Prop, State, Method, Watch } from '@stencil/core';

export const MixinBFactory = (Base: any) => {
  class MixinB extends Base {
    @Prop() prop3: string = 'mixin b text';

    /**
     * Test getter/setter pattern in mixin - ensures default value is preserved
     * and not overwritten with undefined during component initialization.
     */
    private _getterProp: string = 'getter default value';
    @Prop()
    get getterProp(): string {
      return this._getterProp;
    }
    set getterProp(newValue: string) {
      this._getterProp = newValue;
    }
    @Watch('prop3')
    prop3Changed(newValue: string) {
      console.info('mixin b handler prop3:', newValue);
    }

    @State() state3: string = 'mixin b state text';
    @Watch('state3')
    state3Changed(newValue: string) {
      console.info('mixin b handler state3:', newValue);
    }

    @Method()
    async method3() {
      this.prop3 = 'mixin b method3 called';
    }

    render() {
      return (
        <div>
          <p class="mixin-b-prop-1">Another class prop3: {this.prop3}</p>
          <p class="mixin-b-state-1">Another class state3: {this.state3}</p>
          <p class="mixin-b-getter-prop">Mixin getter prop: {this.getterProp}</p>
        </div>
      );
    }
  }
  return MixinB;
};
