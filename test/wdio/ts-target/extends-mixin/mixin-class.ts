import { Prop, Watch } from '@stencil/core';
import { MixinParent } from './mxin-class-parent.js';

export class Mixin extends MixinParent {
  @Prop() prop1: string = 'ExtendedCmp text';
  @Watch('prop1')
  prop1Changed(newValue: string) {
    console.info('extended class handler prop1:', newValue);
  }
}
