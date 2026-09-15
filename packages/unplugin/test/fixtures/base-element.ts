import { Prop } from '@stencil/core';

// Base class — no @Component, just provides shared @Prop definitions
export class BaseElement {
  @Prop() baseProp = 'from base';
}
