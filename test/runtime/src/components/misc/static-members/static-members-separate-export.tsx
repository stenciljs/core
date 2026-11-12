import { Component } from '@stencil/core';

@Component({
  tag: 'static-members-separate-export',
})
class StaticMembersWithSeparateExport {
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
