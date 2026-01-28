import { AttachInternals, Component, h, Method } from '@stencil/core';

@Component({
  tag: 'custom-states-cmp',
})
export class CustomStatesCmp {
  @AttachInternals({
    states: {
      open: true,
      active: false,
      disabled: false,
    },
  })
  internals: ElementInternals;

  /**
   * Toggle a custom state on or off
   * @param stateName the name of the state to toggle
   * @param force optional boolean to force the state on (true) or off (false) 
   */
  @Method()
  async toggleState(stateName: string, force?: boolean): Promise<void> {
    const states = this.internals.states as Set<string>;
    if (force === undefined) {
      // Toggle: if has, delete; if not, add
      if (states.has(stateName)) {
        states.delete(stateName);
      } else {
        states.add(stateName);
      }
    } else if (force) {
      states.add(stateName);
    } else {
      states.delete(stateName);
    }
  }

  /**
   * Check if a custom state is currently set
   * @param stateName the name of the state to check
   * @returns true if the state is set, false otherwise
   */
  @Method()
  async hasState(stateName: string): Promise<boolean> {
    return (this.internals.states as Set<string>).has(stateName);
  }

  render() {
    return <div>Custom States Test</div>;
  }
}
