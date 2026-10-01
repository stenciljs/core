import { Component, Mixin, ReactiveController, ReactiveControllerHost } from '@stencil/core';

/**
 * Regression fixture for the `isPlain` fast-path optimization: this component has no props,
 * state, methods, listeners, or JSX in `render()` (it returns a plain string), so it would be
 * wrongly classified `isPlain: true` if `ReactiveControllerHost`'s inherited lifecycle methods
 * weren't accounted for - the native fast path would replace `connectedCallback` outright and
 * the controller's `hostConnected` would never fire.
 */
class ConnectedController implements ReactiveController {
  hostConnected() {
    (window as any).__extendsReactiveControllerPlainConnected = true;
  }
}

@Component({
  tag: 'extends-reactive-controller-plain-cmp',
})
export class ExtendsReactiveControllerPlainCmp extends Mixin(ReactiveControllerHost) {
  constructor() {
    super();
    this.addController(new ConnectedController());
  }

  render() {
    return 'plain content';
  }
}
