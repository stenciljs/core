import { signal } from '@preact/signals-core';
import { Component, h, Prop, State } from '@stencil/core';
import { expect, describe, it } from '@stencil/vitest';

import { newSpecPage } from '../../testing';

const VDOM = {
  buildFlags: { vdomSignals: true, vdomText: true, vdomAttribute: true, vdomClass: true },
} as const;
const SIG = { buildFlags: { signalBacking: true, vdomSignals: true } } as const;

// Signal text children

describe('vdom signal bypass - text children', () => {
  it('renders the initial signal value as text', async () => {
    const count = signal(5);

    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return <span>{count}</span>;
      }
    }

    const { root } = await newSpecPage({ ...VDOM, components: [CmpA], html: `<cmp-a></cmp-a>` });
    expect(root.querySelector('span').textContent).toBe('5');
  });

  it('updates the text node directly when the signal changes (no re-render)', async () => {
    let renderCount = 0;
    const count = signal(0);

    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        renderCount++;
        return <span>{count}</span>;
      }
    }

    const { root } = await newSpecPage({ ...VDOM, components: [CmpA], html: `<cmp-a></cmp-a>` });
    renderCount = 0;

    count.value = 42;

    // DOM updated synchronously by the subscription
    expect(root.querySelector('span').textContent).toBe('42');
    // Component render() was NOT called again
    expect(renderCount).toBe(0);
  });

  it('wires up live tracking when a position switches from a plain value to a signal on a later render', async () => {
    const count = signal(1);

    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() useSignal = false;
      render() {
        return <span>{this.useSignal ? count : 'static'}</span>;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      ...VDOM,
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    expect(root.querySelector('span').textContent).toBe('static');

    (root as any).useSignal = true;
    await waitForChanges();
    expect(root.querySelector('span').textContent).toBe('1');

    // the text node already existed before the signal showed up - this is the
    // case createElm's wiring alone can't handle, patch() must pick it up too
    count.value = 42;
    expect(root.querySelector('span').textContent).toBe('42');
  });

  it('re-subscribes when a signal-backed position switches to a different signal', async () => {
    const first = signal('first');
    const second = signal('second');

    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() useSecond = false;
      render() {
        return <span>{this.useSecond ? second : first}</span>;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      ...VDOM,
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    expect(root.querySelector('span').textContent).toBe('first');

    (root as any).useSecond = true;
    await waitForChanges();
    expect(root.querySelector('span').textContent).toBe('second');

    // the old subscription (to `first`) must have been torn down - changing it
    // should no longer affect this node
    first.value = 'changed-first';
    expect(root.querySelector('span').textContent).toBe('second');

    // the new subscription (to `second`) must be live
    second.value = 'changed-second';
    expect(root.querySelector('span').textContent).toBe('changed-second');
  });

  it('tears down the subscription when a signal-backed position reverts to a plain value', async () => {
    const count = signal(1);

    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() useSignal = true;
      render() {
        return <span>{this.useSignal ? count : 'static'}</span>;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      ...VDOM,
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });
    expect(root.querySelector('span').textContent).toBe('1');

    (root as any).useSignal = false;
    await waitForChanges();
    expect(root.querySelector('span').textContent).toBe('static');

    // the old subscription must be disposed - changing the signal now should
    // not reach back into this (now unrelated) text node
    count.value = 99;
    expect(root.querySelector('span').textContent).toBe('static');
  });

  it('handles multiple signal text children independently', async () => {
    const a = signal('hello');
    const b = signal('world');

    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <div>
            <span>{a}</span>
            <span>{b}</span>
          </div>
        );
      }
    }

    const { root } = await newSpecPage({ ...VDOM, components: [CmpA], html: `<cmp-a></cmp-a>` });
    const spans = root.querySelectorAll('span');
    expect(spans[0].textContent).toBe('hello');
    expect(spans[1].textContent).toBe('world');

    b.value = 'stencil';
    expect(spans[0].textContent).toBe('hello');
    expect(spans[1].textContent).toBe('stencil');
  });

  it('works with signalBacking @State via proxy', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @State() count = 7;
      render() {
        return <span>{this.count}</span>;
      }
    }

    const { root } = await newSpecPage({ ...SIG, components: [CmpA], html: `<cmp-a></cmp-a>` });
    expect(root.querySelector('span').textContent).toBe('7');
  });
});

// Signal attributes

describe('vdom signal bypass - attributes', () => {
  it('sets the initial attribute value from the signal', async () => {
    const cls = signal('active');

    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return <div class={cls}></div>;
      }
    }

    const { root } = await newSpecPage({ ...VDOM, components: [CmpA], html: `<cmp-a></cmp-a>` });
    expect(root.querySelector('div').className).toBe('active');
  });

  it('updates the attribute directly when the signal changes (no re-render)', async () => {
    let renderCount = 0;
    const cls = signal('before');

    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        renderCount++;
        return <div class={cls}></div>;
      }
    }

    const { root } = await newSpecPage({ ...VDOM, components: [CmpA], html: `<cmp-a></cmp-a>` });
    renderCount = 0;

    cls.value = 'after';

    expect(root.querySelector('div').className).toBe('after');
    expect(renderCount).toBe(0);
  });

  it('handles aria and data attributes via signal', async () => {
    const label = signal('close');

    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return <button aria-label={label}></button>;
      }
    }

    const { root } = await newSpecPage({ ...VDOM, components: [CmpA], html: `<cmp-a></cmp-a>` });
    expect(root.querySelector('button').getAttribute('aria-label')).toBe('close');

    label.value = 'open';
    expect(root.querySelector('button').getAttribute('aria-label')).toBe('open');
  });
});
