import { Component } from '@stencil/core';

@Component({
  tag: 'static-members-separate-initializer',
})
export class StaticMembersWithSeparateInitializer {
  static property: string;
  render() {
    return (
      <div>
        This is a component with static an {StaticMembersWithSeparateInitializer.property} member
      </div>
    );
  }
}
StaticMembersWithSeparateInitializer.property = 'externally initialized';
