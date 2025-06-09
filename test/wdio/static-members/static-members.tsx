import { Component, h } from '@stencil/core';

@Component({
  tag: 'static-members',
})
export class StaticMembers {
  /**
   * See the spec file associated with this file for the motivation for this test
   */
  static property = 'public';
  private static anotherProperty = 'private';

  render() {
    return (
      <div>
        This is a component with static {StaticMembers.property} and {StaticMembers.anotherProperty} members
      </div>
    );
  }
}
