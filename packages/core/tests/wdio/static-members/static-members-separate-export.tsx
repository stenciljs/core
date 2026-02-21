import { Component, h } from '@stencil/core';

@Component({
  tag: 'static-members-separate-export',
})
class StaticMembersWithSeparateExport {
  /**
   * See the spec file associated with this file for the motivation for this test
   */
  static property = 'public';
  private static anotherProperty = 'private';

  render() {
    return (
      <div>
        This is a component with static {StaticMembersWithSeparateExport.property} and{' '}
        {StaticMembersWithSeparateExport.anotherProperty} members
      </div>
    );
  }
}
export { StaticMembersWithSeparateExport };
