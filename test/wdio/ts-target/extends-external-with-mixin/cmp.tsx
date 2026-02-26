import { Component, h, Prop, State, Method, Watch } from '@stencil/core';
import { SiblingWithMixin } from 'test-sibling/dist/collection/sibling-with-mixin/sibling-with-mixin';

/**
 * A component that extends from an external library's component which itself uses a mixin pattern.
 * This tests Bug A: a project importing/rendering from a lib whose component utilises a mixin/abstract
 * class pattern - the decorated class members should be properly merged and have reactivity.
 */
@Component({
  tag: 'extends-external-with-mixin',
})
export class ExtendsExternalWithMixin extends SiblingWithMixin {
  @Prop() prop1: string = 'default text';
  @Watch('prop1')
  prop1Changed(newValue: string) {
    console.info('main class handler prop1:', newValue);
  }

  @State() state1: string = 'default state text';
  @Watch('state1')
  state1Changed(newValue: string) {
    console.info('main class handler state1:', newValue);
  }

  @Method()
  async method1() {
    this.prop1 = 'main class method1 called';
  }

  render() {
    return (
      <div>
        <p class="main-prop-1">Main class prop1: {this.prop1}</p>
        <p class="main-prop-2">Main class prop2: {this.prop2}</p>
        <p class="main-getter-prop">Main class getterProp: {this.getterProp}</p>
        <p class="main-state-1">Main class state1: {this.state1}</p>
        <p class="main-state-2">Main class state2: {this.state2}</p>
      </div>
    );
  }
}
