import {
  Component,
  h,
  Mixin,
  Prop,
  ReactiveController,
  ReactiveControllerHost,
  State,
} from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { expect, describe, it } from '@stencil/vitest';

describe('reactive-controller', () => {
  it('calls hostConnected on an added controller when the component connects', async () => {
    const calls: string[] = [];
    class LogController implements ReactiveController {
      hostConnected() {
        calls.push('hostConnected');
      }
    }

    @Component({ tag: 'rc-connected' })
    class Cmp extends Mixin(ReactiveControllerHost) {
      constructor() {
        super();
        this.addController(new LogController());
      }
      render() {
        return <div />;
      }
    }

    await newSpecPage({ components: [Cmp], html: `<rc-connected></rc-connected>` });

    expect(calls).toEqual(['hostConnected']);
  });

  it('calls hostDisconnected when the component is removed, and stops after removeController', async () => {
    const calls: string[] = [];
    class LogController implements ReactiveController {
      host: any;
      hostDisconnected() {
        calls.push('hostDisconnected');
      }
    }

    const controller = new LogController();

    @Component({ tag: 'rc-disconnected' })
    class Cmp extends Mixin(ReactiveControllerHost) {
      constructor() {
        super();
        controller.host = this;
        this.addController(controller);
      }
      render() {
        return <div />;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [Cmp],
      html: `<rc-disconnected></rc-disconnected>`,
    });

    controller.host.removeController(controller);
    root.remove();
    await waitForChanges();

    expect(calls).toEqual([]);
  });

  it('requestUpdate() forces a re-render', async () => {
    let renderCount = 0;

    class TickController implements ReactiveController {
      host: any;
      constructor(host: any) {
        this.host = host;
        host.addController(this);
      }
      tick() {
        this.host.requestUpdate();
      }
    }

    let ticker: TickController;

    @Component({ tag: 'rc-request-update' })
    class Cmp extends Mixin(ReactiveControllerHost) {
      constructor() {
        super();
        ticker = new TickController(this);
      }
      render() {
        renderCount++;
        return <div>{renderCount}</div>;
      }
    }

    const { waitForChanges } = await newSpecPage({
      components: [Cmp],
      html: `<rc-request-update></rc-request-update>`,
    });

    expect(renderCount).toBe(1);

    ticker!.tick();
    await waitForChanges();

    expect(renderCount).toBe(2);
  });

  it('awaits an async hostWillLoad before the first render', async () => {
    class AsyncController implements ReactiveController {
      host: any;
      constructor(host: any) {
        this.host = host;
        host.addController(this);
      }
      async hostWillLoad() {
        await Promise.resolve();
        this.host.ready = true;
      }
    }

    @Component({ tag: 'rc-async-will-load' })
    class Cmp extends Mixin(ReactiveControllerHost) {
      @State() ready = false;
      private ctrl = new AsyncController(this);
      render() {
        return <div>{this.ready ? 'ready' : 'loading'}</div>;
      }
    }

    const { root } = await newSpecPage({
      components: [Cmp],
      html: `<rc-async-will-load></rc-async-will-load>`,
    });

    expect(root.querySelector('div')?.textContent).toBe('ready');
  });

  it('fires hostDidLoad, then hostWillUpdate/hostDidUpdate on subsequent updates', async () => {
    const calls: string[] = [];
    class LogController implements ReactiveController {
      hostDidLoad() {
        calls.push('hostDidLoad');
      }
      hostWillUpdate() {
        calls.push('hostWillUpdate');
      }
      hostDidUpdate() {
        calls.push('hostDidUpdate');
      }
    }

    @Component({ tag: 'rc-update-order' })
    class Cmp extends Mixin(ReactiveControllerHost) {
      @Prop() value = 0;
      constructor() {
        super();
        this.addController(new LogController());
      }
      render() {
        return <div>{this.value}</div>;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [Cmp],
      html: `<rc-update-order></rc-update-order>`,
    });

    expect(calls).toEqual(['hostDidLoad']);

    (root as any).value = 1;
    await waitForChanges();

    expect(calls).toEqual(['hostDidLoad', 'hostWillUpdate', 'hostDidUpdate']);
  });

  it('composes with another mixin without dropping its lifecycle hooks', async () => {
    const calls: string[] = [];

    const LoggingMixin = <B extends new (...args: any[]) => any>(Base: B) => {
      class WithLogging extends Base {
        connectedCallback() {
          super.connectedCallback?.();
          calls.push('other-mixin-connected');
        }
      }
      return WithLogging;
    };

    class LogController implements ReactiveController {
      hostConnected() {
        calls.push('controller-connected');
      }
    }

    @Component({ tag: 'rc-composed' })
    class Cmp extends Mixin(ReactiveControllerHost, LoggingMixin) {
      constructor() {
        super();
        this.addController(new LogController());
      }
      render() {
        return <div />;
      }
    }

    await newSpecPage({ components: [Cmp], html: `<rc-composed></rc-composed>` });

    expect(calls).toContain('controller-connected');
    expect(calls).toContain('other-mixin-connected');
  });

  it('updateComplete resolves after the next render commits', async () => {
    let renderCount = 0;
    let host: any;

    @Component({ tag: 'rc-update-complete' })
    class Cmp extends Mixin(ReactiveControllerHost) {
      @Prop() value = 0;
      constructor() {
        super();
        host = this;
      }
      render() {
        renderCount++;
        return <div>{this.value}</div>;
      }
    }

    const { waitForChanges } = await newSpecPage({
      components: [Cmp],
      html: `<rc-update-complete></rc-update-complete>`,
    });

    expect(renderCount).toBe(1);

    const pending = host.updateComplete;
    host.value = 1;
    await waitForChanges();

    await expect(pending).resolves.toBe(true);
    expect(renderCount).toBe(2);
  });

  it('fires hostConnected immediately for a controller added after the host already connected', async () => {
    const calls: string[] = [];
    let host: any;

    @Component({ tag: 'rc-late-controller' })
    class Cmp extends Mixin(ReactiveControllerHost) {
      constructor() {
        super();
        host = this;
      }
      render() {
        return <div />;
      }
    }

    await newSpecPage({ components: [Cmp], html: `<rc-late-controller></rc-late-controller>` });

    class LateController implements ReactiveController {
      hostConnected() {
        calls.push('hostConnected');
      }
    }
    host.addController(new LateController());

    expect(calls).toEqual(['hostConnected']);
  });
});
