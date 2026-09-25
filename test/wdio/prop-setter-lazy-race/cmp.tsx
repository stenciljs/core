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

  private _count = 0;
  @Prop()
  get count() {
    return this._count;
  }
  set count(newValue: number) {
    this._count = newValue;
  }

  @Prop({ mutable: true }) connectedSnapshot = '';

  connectedCallback() {
    this.connectedSnapshot = `${this.isReadonly}-${this.count}`;
  }

  render() {
    return `${this.isReadonly}-${this.plainReadonly}`;
  }
}
