import { Component, Host, State } from '@stencil/core';

import { MouseController } from './mouse-controller.js';
import { ReactiveControllerHost } from './reactive-controller-host.js';

/**
 * A component that extends ReactiveControllerHost to use reactive controllers.
 * Tests that the controller pattern works correctly with Stencil components.
 */
@Component({
  tag: 'extends-via-host-cmp',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class ExtendsViaHostCmp extends ReactiveControllerHost {
  private mouse = new MouseController(this);

  // Track lifecycle calls for testing
  @State() lifecycleCalls: string[] = [];

  componentWillLoad(): void {
    super.componentWillLoad(); // Call base class to trigger controllers
    this.lifecycleCalls = [...this.lifecycleCalls, 'componentWillLoad'];
  }

  componentDidLoad(): void {
    super.componentDidLoad(); // Call base class to trigger controllers
    this.lifecycleCalls = [...this.lifecycleCalls, 'componentDidLoad'];
  }

  render() {
    return (
      <Host>
        <h3>The mouse is at:</h3>
        <pre class='mouse-position'>
          x: {this.mouse.pos.x}
          y: {this.mouse.pos.y}
        </pre>
        <div class='lifecycle-info' style={{ display: 'none' }}>
          Lifecycle calls: {this.lifecycleCalls.join(', ')}
        </div>
      </Host>
    );
  }
}
