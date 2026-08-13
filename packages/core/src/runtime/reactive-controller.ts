import { forceUpdate } from './update-component';
import type {
  ComponentInterface,
  ReactiveController,
  ReactiveControllerHostInterface,
} from '../declarations/stencil-public-runtime';

type Ctor<T = {}> = new (...args: any[]) => T;

// Explicit return type: the class below has a #private field, which the dts bundler can't
// describe for an exported function's inferred (anonymous) return type (TS4094).
export const ReactiveControllerHost = <B extends Ctor<ComponentInterface>>(
  Base: B,
): Ctor<InstanceType<B> & ReactiveControllerHostInterface> => {
  class ReactiveControllerHostMixin extends Base implements ReactiveControllerHostInterface {
    controllers = new Set<ReactiveController>();
    #updateCompleteResolvers: Array<(value: boolean) => void> = [];

    addController(controller: ReactiveController) {
      this.controllers.add(controller);
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
      this.controllers.forEach((c) => c.hostConnected?.());
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
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
  }
  // TS can't verify a generically-extended class satisfies InstanceType<B> - same pattern used
  // by other mixin factories in this codebase (e.g. test/runtime's mixin-factories.ts).
  return ReactiveControllerHostMixin as unknown as Ctor<
    InstanceType<B> & ReactiveControllerHostInterface
  >;
};
