import { Component, h, Prop } from '@stencil/core';

/**
 * @virtualProp mode - Mode
 */
@Component({
  tag: 'my-cmp',
  shadow: true,
})
export class MyCmp {
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
        <my-jsx-cmp fooProp="foo3" barProp="bar3"></my-jsx-cmp>
        <my-jsx-cmp foo-prop="foo4" bar-prop="bar4"></my-jsx-cmp>
      </div>
    );
  }
}
