import { Component, h, Prop } from '@stencil/core';

enum Foo {
  // names are explicitly different to ensure we aren't
  // just resolving the declaration name.
  BAR = 'first',
  BAZ = 'middle',
}

const MyProp = 'last';

@Component({
  tag: 'computed-properties-prop-decorator',
})
export class ComputedPropertiesPropDecorator {
  @Prop() [Foo.BAR] = 'no';

  @Prop() [Foo.BAZ]: string = '';

  @Prop() [MyProp] = 'content';

  getText() {
    return (this.first || '') + (this.middle ? ` ${this.middle}` : '') + (this.last ? ` ${this.last}` : '');
  }

  render() {
    return <div>{this.getText()}</div>;
  }
}
