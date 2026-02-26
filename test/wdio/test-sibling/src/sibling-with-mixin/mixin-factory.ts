import { Prop, State, Method, Watch } from '@stencil/core';

/**
 * A mixin factory function that returns a class with Stencil decorators.
 * This tests the scenario where a component in an external library uses
 * a mixin pattern internally.
 */
export const SiblingMixinFactory = <B extends new (...args: any[]) => any>(Base: B) => {
  class SiblingMixin extends Base {
    /**
     * Test getter/setter pattern - ensures default value is preserved
     * and not overwritten with undefined during component initialization.
     * Using JS private field (#) instead of TS private to avoid declaration emit issues.
     */
    #_getterProp: string = 'getter default value';
    @Prop()
    get getterProp(): string {
      return this.#_getterProp;
    }
    set getterProp(newValue: string) {
      this.#_getterProp = newValue;
    }

    @Prop() prop1: string = 'ExtendedCmp text';
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
  return SiblingMixin;
};
