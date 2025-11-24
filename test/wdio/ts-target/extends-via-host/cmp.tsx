import { Component, h, Host, State } from "@stencil/core";
import { ReactiveControllerHost } from "./reactive-controller-host.js";
import { MouseController } from "./mouse-controller.js";

@Component({
  tag: "extends-via-host-cmp",
  scoped: true,
  styles: `:host { display: block; }`,
})
export class MyComponent extends ReactiveControllerHost {
  private mouse = new MouseController(this);
  
  // Track lifecycle calls for testing
  @State() lifecycleCalls: string[] = [];

  componentWillLoad() {
    super.componentWillLoad(); // Call base class to trigger controllers
    this.lifecycleCalls = [...this.lifecycleCalls, 'componentWillLoad'];
  }

  componentDidLoad() {
    super.componentDidLoad(); // Call base class to trigger controllers
    this.lifecycleCalls = [...this.lifecycleCalls, 'componentDidLoad'];
  }

  render() {
    return (
      <Host>
        <h3>The mouse is at:</h3>
        <pre class="mouse-position">
          x: {this.mouse.pos.x as number}
          y: {this.mouse.pos.y as number}
        </pre>
        <div class="lifecycle-info" style={{ display: 'none' }}>
          Lifecycle calls: {this.lifecycleCalls.join(', ')}
        </div>
      </Host>
    );
  }
}
