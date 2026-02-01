import type { ComponentInterface } from '../declarations/stencil-public-runtime';
import { forceUpdate } from './update-component';

export interface ReactiveController {
  hostConnected?(): void;
  hostDisconnected?(): void;
  hostWillLoad?(): Promise<void> | void;
  hostDidLoad?(): void;
  hostWillRender?(): Promise<void> | void;
  hostDidRender?(): void;
  hostWillUpdate?(): Promise<void> | void;
  hostDidUpdate?(): void;
}

/**
 * Base class for components that want to use reactive controllers.
 *
 * Components extending this class can use the composition pattern to share
 * stateful logic via reactive controllers.
 *
 * Known Limitation: Components extending ReactiveControllerHost cannot use
 * `<Host>` as their root element in the render method. This is because
 * ReactiveControllerHost does not extend HTMLElement. Instead, return a
 * regular element (like `<div>`) as the root.
 *
 * @example
 * ```tsx
 * @Component({ tag: 'my-component' })
 * export class MyComponent extends ReactiveControllerHost {
 *   private myController = new MyController(this);
 *
 *   render() {
 *     return <div>...</div>; // Use <div>, not <Host>
 *   }
 * }
 * ```
 */
export class ReactiveControllerHost implements ComponentInterface {
  controllers = new Set<ReactiveController>();

  addController(controller: ReactiveController) {
    this.controllers.add(controller);
  }

  removeController(controller: ReactiveController) {
    this.controllers.delete(controller);
  }

  requestUpdate() {
    forceUpdate(this);
  }

  connectedCallback() {
    this.controllers.forEach((controller) => controller.hostConnected?.());
  }

  disconnectedCallback() {
    this.controllers.forEach((controller) => controller.hostDisconnected?.());
  }

  componentWillLoad() {
    this.controllers.forEach((controller) => controller.hostWillLoad?.());
  }

  componentDidLoad() {
    this.controllers.forEach((controller) => controller.hostDidLoad?.());
  }

  componentWillRender() {
    this.controllers.forEach((controller) => controller.hostWillRender?.());
  }

  componentDidRender() {
    this.controllers.forEach((controller) => controller.hostDidRender?.());
  }

  componentWillUpdate() {
    this.controllers.forEach((controller) => controller.hostWillUpdate?.());
  }

  componentDidUpdate() {
    this.controllers.forEach((controller) => controller.hostDidUpdate?.());
  }
}
