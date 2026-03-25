import { Component, h, Host, Prop } from '@stencil/core';
import { saveAs } from 'file-saver';

/**
 * @virtualProp mode - Mode
 */
@Component({
  tag: 'prop-cmp',
  styleUrls: {
    ios: 'prop-cmp.ios.css',
    md: 'prop-cmp.md.css',
  },
  shadow: true,
})
export class PropCmp {
  private _clothes = 'life preservers';
  @Prop() first: string;
  @Prop() lastName: string;
  @Prop()
  get fullName() {
    return 'Mr ' + this.first + ' ' + this.lastName;
  }
  @Prop()
  get clothes() {
    return this._clothes;
  }
  set clothes(newVal: string) {
    if (newVal === 'lab coats' || newVal === 'down filled jackets') this._clothes = newVal;
  }

  saveAs() {
    saveAs('data', 'filename.txt');
  }

  render() {
    return (
      <Host>
        <div>
          Hello, my name is {this.first} {this.lastName}. My full name being {this.fullName}. I like to wear{' '}
          {this.clothes}.
        </div>
        <button onClick={() => this.saveAs()}>File Save</button>
      </Host>
    );
  }
}
