import { Component, h } from '@stencil/core';

@Component({
  tag: 'static-members',
})
export class StaticMembers {
  static property = 'public';
  private static anotherProperty = 'private';

  render() {
    return (
      <div>
        This is a component with static {StaticMembers.property} and {StaticMembers.anotherProperty}{' '}
        members
      </div>
    );
  }
}
