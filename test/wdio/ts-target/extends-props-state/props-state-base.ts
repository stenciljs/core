import { Prop, State } from '@stencil/core';

/**
 * Base class with @Prop and @State decorators for inheritance testing.
 * Tests that components can inherit and use properties and state from base classes.
 */
export class PropsStateBase {
  // Base @Prop - inherited by component
  @Prop() baseProp: string = 'base prop value';
  
  // Base @Prop with different type
  @Prop() baseCount: number = 0;
  
  // Base @State - inherited by component, should trigger reactivity
  @State() baseState: string = 'base state value';
  
  // Base @State with boolean type
  @State() baseEnabled: boolean = true;
}

