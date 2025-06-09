import { Component, h } from '@stencil/core';

@Component({
  tag: 'static-members-separate-initializer',
})
export class StaticMembersWithSeparateInitializer {
  /**
   * See the spec file associated with this file for the motivation for this test
   */
  static property: string;
  render() {
    return <div>This is a component with static an {StaticMembersWithSeparateInitializer.property} member</div>;
  }
}
StaticMembersWithSeparateInitializer.property = 'externally initialized';
