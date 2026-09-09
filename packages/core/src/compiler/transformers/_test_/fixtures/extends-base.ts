import { Event, EventEmitter, Method, Prop, State } from '@stencil/core';

/**
 * Fixture: a standalone base class with Stencil-decorated members.
 * Used by parse-extends.spec.ts to verify that cross-file inheritance
 * is correctly resolved by the transpile() public API via `extraFiles`.
 */
export class ExtendsBase {
  @Prop() baseProp: string = 'base';
  @State() baseState: number = 0;
  @Method() async baseMethod(): Promise<void> {}
  @Event() baseEvent!: EventEmitter<string>;
}
