import { Prop } from '@stencil/core';

import { GrandBase } from './grand-base.js';

// Middle class — has @Prop but no @Component. Keeps `extends GrandBase`.
export class MiddleElement extends GrandBase {
  @Prop() middleProp = 'from middle';
}
