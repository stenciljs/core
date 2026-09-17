import { Event, EventEmitter, Prop } from '@stencil/core';

import { ExtendsBase } from './extends-base';

/**
 * Fixture: an intermediate class that itself extends ExtendsBase.
 * Used to verify multi-level inheritance resolution via `extraFiles`.
 */
export class ExtendsIntermediate extends ExtendsBase {
  @Prop() intermediateProp: string = 'intermediate';
  @Event() intermediateEvent!: EventEmitter<boolean>;
}
