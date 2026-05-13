import { Component, Prop } from '@stencil/core';

/**
 * @virtualProp mode - Mode
 */
@Component({
  tag: 'my-jsx-cmp',
  encapsulation: { type: 'shadow' },
})
export class MyJsxCmp {
  /**
   * foo prop
   */
  @Prop()
  fooProp: string;

  /**
   * bar prop
   * @returns bar
   */
  @Prop()
  get barProp() {
    return 'bar';
  }

  render() {
    return (
      <div>
        {this.fooProp} - {this.barProp}
      </div>
    );
  }
}
