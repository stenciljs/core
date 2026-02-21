import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'static-decorated-members',
})
export class StaticDecoratedMembers {
  /**
   * See the spec file associated with this file for the motivation for this test
   */
  @State() static property = '@State-ful';

  render() {
    return <div>This is a component with a static Stencil decorated member</div>;
  }
}
