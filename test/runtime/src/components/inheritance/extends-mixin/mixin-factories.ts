import { h, Prop, State, Method, Watch } from '@stencil/core';

/**
 * MixinA factory - provides prop1, prop2, state1, state2, method1, method2
 */
export const MixinAFactory = <B extends new (...args: any[]) => any>(Base: B) => {
  class MixinA extends Base {
    @Prop() prop1: string = 'MixinA text';
    @Watch('prop1')
    prop1Changed(newValue: string) {
      console.info('extended class handler prop1:', newValue);
    }

    @Prop() prop2: string = 'ExtendedCmp prop2 text';
    @Watch('prop2')
    prop2Changed(newValue: string) {
      console.info('extended class handler prop2:', newValue);
    }

    @State() state1: string = 'ExtendedCmp state text';
    @Watch('state1')
    state1Changed(newValue: string) {
      console.info('extended class handler state1:', newValue);
    }

    @State() state2: string = 'ExtendedCmp state2 text';
    @Watch('state2')
    state2Changed(newValue: string) {
      console.info('extended class handler state2:', newValue);
    }

    @Method()
    async method1() {
      this.prop1 = 'ExtendedCmp method1 called';
    }

    @Method()
    async method2() {
      this.prop1 = 'ExtendedCmp method2 called';
    }
  }
  return MixinA;
};

/**
 * MixinB factory - provides prop3, state3, method3, getterProp
 */
export const MixinBFactory = <B extends new (...args: any[]) => any>(Base: B) => {
  class MixinB extends Base {
    @Prop() prop3: string = 'mixin b text';
    @Watch('prop3')
    prop3Changed(newValue: string) {
      console.info('mixin b handler prop3:', newValue);
    }

    /**
     * Test getter/setter pattern in mixin - ensures default value is preserved
     * and not overwritten with undefined during component initialization.
     */
    #_getterProp: string = 'getter default value';
    @Prop()
    get getterProp(): string {
      return this.#_getterProp;
    }
    set getterProp(newValue: string) {
      this.#_getterProp = newValue;
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
  }
  return MixinB;
};
