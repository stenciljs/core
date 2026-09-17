import { getElement } from './element';
import { forceUpdate } from './update-component';
import type {
  ComponentInterface,
  ReactiveController,
  ReactiveControllerHostInterface,
  MixedInCtor,
} from '../declarations/stencil-public-runtime';

export const ReactiveControllerHost = <B extends MixedInCtor<ComponentInterface & HTMLElement>>(
  Base: B,
): B & MixedInCtor<ReactiveControllerHostInterface> =>
  class ReactiveControllerHostMixin extends Base implements ReactiveControllerHostInterface {
    controllers = new Set<ReactiveController>();
    #connected = false;
    #updateCompleteResolvers: Array<(value: boolean) => void> = [];

    addController(controller: ReactiveController) {
      this.controllers.add(controller);
      // Matches Lit's ReactiveElement: a controller added after the host is already connected
      // (e.g. constructed from a lifecycle hook rather than a field initializer - needed for any
      // controller that wants a real DOM element, see connectedCallback below) would otherwise
      // never see hostConnected - the bulk connectedCallback pass below already ran without it.
      if (this.#connected) {
        controller.hostConnected?.();
      }
    }

    removeController(controller: ReactiveController) {
      this.controllers.delete(controller);
    }

    requestUpdate() {
      forceUpdate(this);
    }

    get updateComplete(): Promise<boolean> {
      return new Promise((resolve) => this.#updateCompleteResolvers.push(resolve));
    }

    connectedCallback() {
      super.connectedCallback?.();
      this.#connected = true;

      // Under lazy-loading, `this` (the lazy instance) and the real host element are different
      // objects - only `this` has addController/removeController/requestUpdate/updateComplete. A
      // controller that needs genuine DOM access (addEventListener/dispatchEvent, e.g.
      // @lit/context) needs a single object with both capabilities; bridge them onto the real
      // element here so `@Element()`/`getElement(this)` works uniformly across build targets. In
      // a standalone build getElement(this) === this, so this is a no-op there.
      const el = getElement(this) as any;
      if (el && el !== (this as unknown)) {
        el.addController = (controller: ReactiveController) => this.addController(controller);
        el.removeController = (controller: ReactiveController) => this.removeController(controller);
        el.requestUpdate = () => this.requestUpdate();
        Object.defineProperty(el, 'updateComplete', {
          configurable: true,
          get: () => this.updateComplete,
        });
      }

      this.controllers.forEach((c) => c.hostConnected?.());
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.#connected = false;
      this.controllers.forEach((c) => c.hostDisconnected?.());
    }

    async componentWillLoad() {
      await super.componentWillLoad?.();
      await Promise.all([...this.controllers].map((c) => c.hostWillLoad?.()));
    }

    componentDidLoad() {
      super.componentDidLoad?.();
      this.controllers.forEach((c) => c.hostDidLoad?.());
    }

    async componentWillRender() {
      await super.componentWillRender?.();
      await Promise.all([...this.controllers].map((c) => c.hostWillRender?.()));
    }

    componentDidRender() {
      super.componentDidRender?.();
      this.controllers.forEach((c) => c.hostDidRender?.());
      const resolvers = this.#updateCompleteResolvers;
      this.#updateCompleteResolvers = [];
      resolvers.forEach((resolve) => resolve(true));
    }

    async componentWillUpdate() {
      await super.componentWillUpdate?.();
      await Promise.all([...this.controllers].map((c) => c.hostWillUpdate?.()));
    }

    componentDidUpdate() {
      super.componentDidUpdate?.();
      this.controllers.forEach((c) => c.hostDidUpdate?.());
    }
  };
