import { Component, Prop } from '@stencil/core';

/**
 * Only ever touched by one test, so its chunk is guaranteed to still be loading when that test
 * writes to it.
 */
@Component({
  tag: 'prop-setter-lazy-race-cold',
})
export class PropSetterLazyRaceCold {
  private _isDisabled = false;
  @Prop()
  get isDisabled() {
    return this._isDisabled;
  }
  set isDisabled(newValue: boolean) {
    this._isDisabled = newValue;
  }

  private _note = '';
  @Prop()
  get note() {
    return this._note;
  }
  set note(newValue: string) {
    this._note = newValue;
  }

  render() {
    return `${this.isDisabled}`;
  }
}
