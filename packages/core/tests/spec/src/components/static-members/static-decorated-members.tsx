import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'static-decorated-members',
})
export class StaticDecoratedMembers {
  @State() static property = '@State-ful';

  render() {
    return <div>This is a component with a static Stencil decorated member</div>;
  }
}
