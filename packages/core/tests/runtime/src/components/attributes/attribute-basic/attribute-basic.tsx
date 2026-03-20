import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'attribute-basic',
})
export class AttributeBasic {
  private _getter = 'getter';
  @Prop() single = 'single';
  @Prop() multiWord = 'multiWord';
  @Prop({ attribute: 'my-custom-attr' }) customAttr = 'my-custom-attr';
  @Prop()
  get getter() {
    return this._getter;
  }
  set getter(newVal: string) {
    this._getter = newVal;
  }

  render() {
    return (
      <div>
        <div class="single">{this.single}</div>
        <div class="multiWord">{this.multiWord}</div>
        <div class="customAttr">{this.customAttr}</div>
        <div class="getter">{this.getter}</div>
        <div>
          <label class="htmlForLabel" htmlFor={'a'}>
            htmlFor
          </label>
          <input type="checkbox" id={'a'}></input>
        </div>
      </div>
    );
  }
}
