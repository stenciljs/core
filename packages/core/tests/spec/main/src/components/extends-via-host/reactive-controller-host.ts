import { forceUpdate } from '@stencil/core';

/**
 * Interface for reactive controllers (Lit-compatible pattern)
 */
export interface ReactiveController {
  hostConnected?(): void;
  hostDisconnected?(): void;
  hostWillLoad?(): void;
  hostDidLoad?(): void;
  hostWillRender?(): void;
  hostDidRender?(): void;
  hostWillUpdate?(): void;
  hostDidUpdate?(): void;
}

/**
 * Base class that implements the reactive controller host interface.
 * This pattern allows controllers to hook into the component's lifecycle
 * and request updates when their state changes.
 */
export class ReactiveControllerHost {
  private controllers: Set<ReactiveController> = new Set();

  addController(controller: ReactiveController): void {
    this.controllers.add(controller);
  }

  removeController(controller: ReactiveController): void {
    this.controllers.delete(controller);
  }

  requestUpdate(): void {
    forceUpdate(this);
  }

  connectedCallback(): void {
    this.controllers.forEach((controller) => controller.hostConnected?.());
  }

  disconnectedCallback(): void {
    this.controllers.forEach((controller) => controller.hostDisconnected?.());
  }

  componentWillLoad(): void {
    this.controllers.forEach((controller) => controller.hostWillLoad?.());
  }

  componentDidLoad(): void {
    this.controllers.forEach((controller) => controller.hostDidLoad?.());
  }

  componentWillRender(): void {
    this.controllers.forEach((controller) => controller.hostWillRender?.());
  }

  componentDidRender(): void {
    this.controllers.forEach((controller) => controller.hostDidRender?.());
  }

  componentWillUpdate(): void {
    this.controllers.forEach((controller) => controller.hostWillUpdate?.());
  }

  componentDidUpdate(): void {
    this.controllers.forEach((controller) => controller.hostDidUpdate?.());
  }
}
