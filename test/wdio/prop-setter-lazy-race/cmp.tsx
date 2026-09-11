import { Component, Prop } from '@stencil/core';

@Component({
  tag: 'prop-setter-lazy-race',
})
export class PropSetterLazyRace {
  @Prop({ reflect: true }) plainReadonly = false;

  private _isReadonly = false;
  @Prop({ reflect: true })
  get isReadonly() {
    return this._isReadonly;
  }
  set isReadonly(newValue: boolean) {
    this._isReadonly = !!newValue;
  }

  render() {
    return `${this.isReadonly}-${this.plainReadonly}`;
  }
}
