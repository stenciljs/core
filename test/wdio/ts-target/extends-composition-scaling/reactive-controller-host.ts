import { ComponentInterface } from "@stencil/core";

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

export class ReactiveControllerHost implements ComponentInterface {
  controllers = new Set<ReactiveController>();

  addController(controller: ReactiveController) {
    this.controllers.add(controller);
  }

  removeController(controller: ReactiveController) {
    this.controllers.delete(controller);
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

