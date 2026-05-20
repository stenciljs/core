import { Component, h, Method, Prop, State, Watch } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { expect, describe, it, vi } from '@stencil/vitest';

import { Effect, computed } from '../../signals';

/** Shared option applied to every test — the only thing that makes these tests distinct. */
const SIG = { buildFlags: { signalBacking: true, vdomSignals: true } } as const;

describe('signals (signalBacking: true)', () => {
  describe('@State', () => {
    it('renders initial state value', async () => {
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

    it('triggers a re-render when state changes', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() count = 0;

        @Method()
        async increment() {
          this.count++;
        }

        render() {
          return <span>{this.count}</span>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        ...SIG,
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      await root.increment();
      await waitForChanges();
      expect(root.querySelector('span').textContent).toBe('1');
    });

    it('does not re-render when state is set to the same value', async () => {
      let renderCount = 0;

      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() count = 5;

        @Method()
        async setSame() {
          this.count = 5;
        }

        render() {
          renderCount++;
          return <span>{this.count}</span>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        ...SIG,
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      renderCount = 0; // reset after initial render
      await root.setSame();
      await waitForChanges();
      expect(renderCount).toBe(0);
    });

    it('treats NaN → NaN as no-change (no re-render)', async () => {
      let renderCount = 0;

      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() val: number = NaN;

        @Method()
        async setNaN() {
          this.val = NaN;
        }

        render() {
          renderCount++;
          return <span>{String(this.val)}</span>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        ...SIG,
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      renderCount = 0;
      await root.setNaN();
      await waitForChanges();
      expect(renderCount).toBe(0);
    });
  });

  describe('@Prop', () => {
    it('renders initial prop from HTML attribute', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() label = 'default';
        render() {
          return <span>{this.label}</span>;
        }
      }

      const { root } = await newSpecPage({
        ...SIG,
        components: [CmpA],
        html: `<cmp-a label="hello"></cmp-a>`,
      });
      expect(root.querySelector('span').textContent).toBe('hello');
    });

    it('triggers a re-render when prop changes via JS', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() label = 'before';
        render() {
          return <span>{this.label}</span>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        ...SIG,
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      root.label = 'after';
      await waitForChanges();
      expect(root.querySelector('span').textContent).toBe('after');
    });

    it('triggers a re-render when prop changes via attribute', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() count = 0;
        render() {
          return <span>{this.count}</span>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        ...SIG,
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      root.setAttribute('count', '42');
      await waitForChanges();
      expect(root.querySelector('span').textContent).toBe('42');
    });
  });

  describe('@Watch', () => {
    it('fires on @State change after initial load', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() count = 0;

        @Watch('count')
        onCountChange() {}

        @Method()
        async increment() {
          this.count++;
        }
      }

      const { root, rootInstance } = await newSpecPage({
        ...SIG,
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });
      vi.spyOn(rootInstance, 'onCountChange');

      await root.increment();
      expect(rootInstance.onCountChange).toHaveBeenCalledOnce();
    });

    it('fires on @Prop change after initial load', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() value = 0;

        @Watch('value')
        onValueChange() {}
      }

      const { root, rootInstance } = await newSpecPage({
        ...SIG,
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });
      vi.spyOn(rootInstance, 'onValueChange');

      root.value = 10;
      expect(rootInstance.onValueChange).toHaveBeenCalledOnce();
    });

    it('does NOT fire during initial component load', async () => {
      const calls: number[] = [];

      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() count = 5;

        @Watch('count')
        onCountChange(newVal: number) {
          calls.push(newVal);
        }
      }

      await newSpecPage({ ...SIG, components: [CmpA], html: `<cmp-a></cmp-a>` });
      expect(calls).toHaveLength(0);
    });

    it('passes (newVal, oldVal, propName) to the watcher', async () => {
      const args: [unknown, unknown, string][] = [];

      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() count = 10;

        @Watch('count')
        onCountChange(newVal: number, oldVal: number, name: string) {
          args.push([newVal, oldVal, name]);
        }

        @Method()
        async set(n: number) {
          this.count = n;
        }
      }

      const { root } = await newSpecPage({
        ...SIG,
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      await root.set(20);
      expect(args).toEqual([[20, 10, 'count']]);

      await root.set(30);
      expect(args).toEqual([
        [20, 10, 'count'],
        [30, 20, 'count'],
      ]);
    });

    it('fires with { immediate: true } during initial load', async () => {
      const calls: number[] = [];

      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() count = 3;

        @Watch('count', { immediate: true })
        onCountChange(newVal: number) {
          calls.push(newVal);
        }
      }

      await newSpecPage({ ...SIG, components: [CmpA], html: `<cmp-a></cmp-a>` });
      expect(calls).toHaveLength(1);
      expect(calls[0]).toBe(3);
    });

    it('does NOT fire when value is set to the same value', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() count = 5;

        @Watch('count')
        onCountChange() {}

        @Method()
        async setSame() {
          this.count = 5;
        }
      }

      const { root, rootInstance } = await newSpecPage({
        ...SIG,
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });
      vi.spyOn(rootInstance, 'onCountChange');

      await root.setSame();
      expect(rootInstance.onCountChange).not.toHaveBeenCalled();
    });

    it('supports multiple @Watch decorators on the same method', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() a = 0;
        @State() b = 0;

        @Watch('a')
        @Watch('b')
        onChange() {}

        @Method()
        async bumpA() {
          this.a++;
        }

        @Method()
        async bumpB() {
          this.b++;
        }
      }

      const { root, rootInstance } = await newSpecPage({
        ...SIG,
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });
      vi.spyOn(rootInstance, 'onChange');

      await root.bumpA();
      await root.bumpB();
      expect(rootInstance.onChange).toHaveBeenCalledTimes(2);
    });
  });

  // ── componentShouldUpdate ──────────────────────────────────────────────────

  describe('componentShouldUpdate', () => {
    it('can veto a re-render by returning false', async () => {
      let renderCount = 0;

      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() count = 0;

        componentShouldUpdate() {
          return false;
        }

        @Method()
        async increment() {
          this.count++;
        }

        render() {
          renderCount++;
          return <span>{this.count}</span>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        ...SIG,
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      renderCount = 0;
      await root.increment();
      await waitForChanges();
      expect(renderCount).toBe(0);
      expect(root.querySelector('span').textContent).toBe('0');
    });
  });

  describe('@Effect()', () => {
    it('runs immediately on initialization', async () => {
      const calls: number[] = [];

      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() count = 3;

        @Effect()
        track() {
          calls.push(this.count);
        }
      }

      await newSpecPage({ ...SIG, components: [CmpA], html: `<cmp-a></cmp-a>` });
      expect(calls).toEqual([3]);
    });

    it('re-runs when a tracked @State changes', async () => {
      const calls: number[] = [];

      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() count = 0;

        @Method()
        async increment() {
          this.count++;
        }

        @Effect()
        track() {
          calls.push(this.count);
        }
      }

      const { root } = await newSpecPage({ ...SIG, components: [CmpA], html: `<cmp-a></cmp-a>` });
      await root.increment();
      expect(calls).toEqual([0, 1]);
    });

    it('re-runs when a tracked @Prop changes', async () => {
      const calls: string[] = [];

      @Component({ tag: 'cmp-a' })
      class CmpA {
        @Prop() label = 'initial';

        @Effect()
        track() {
          calls.push(this.label);
        }
      }

      const { root } = await newSpecPage({ ...SIG, components: [CmpA], html: `<cmp-a></cmp-a>` });
      root.label = 'updated';
      expect(calls).toEqual(['initial', 'updated']);
    });

    it('does NOT re-run for state it did not read', async () => {
      let effectCalls = 0;

      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() tracked = 0;
        @State() untracked = 0;

        @Method()
        async bumpUntracked() {
          this.untracked++;
        }

        @Effect()
        onlyTracksOne() {
          void this.tracked;
          effectCalls++;
        }
      }

      const { root } = await newSpecPage({ ...SIG, components: [CmpA], html: `<cmp-a></cmp-a>` });
      effectCalls = 0;
      await root.bumpUntracked();
      expect(effectCalls).toBe(0);
    });

    it('multiple @Effect() methods each track independently', async () => {
      const aLog: number[] = [];
      const bLog: number[] = [];

      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() a = 1;
        @State() b = 2;

        @Method()
        async setA(v: number) {
          this.a = v;
        }

        @Effect()
        trackA() {
          aLog.push(this.a);
        }

        @Effect()
        trackB() {
          bLog.push(this.b);
        }
      }

      const { root } = await newSpecPage({ ...SIG, components: [CmpA], html: `<cmp-a></cmp-a>` });
      await root.setA(10);
      // trackA re-ran; trackB did not
      expect(aLog).toEqual([1, 10]);
      expect(bLog).toEqual([2]);
    });
  });

  describe('computed() class field', () => {
    it('returns the derived value in render', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() count = 4;
        doubled = computed(() => this.count * 2);
        render() {
          return <span>{this.doubled}</span>;
        }
      }

      const { root } = await newSpecPage({ ...SIG, components: [CmpA], html: `<cmp-a></cmp-a>` });
      expect(root.querySelector('span').textContent).toBe('8');
    });

    it('updates the rendered value when its tracked dependency changes', async () => {
      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() count = 1;

        @Method()
        async setCount(n: number) {
          this.count = n;
        }

        doubled = computed(() => this.count * 2);
        render() {
          return <span>{this.doubled}</span>;
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        ...SIG,
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });
      await root.setCount(10);
      await waitForChanges();
      expect(root.querySelector('span').textContent).toBe('20');
    });

    it('does NOT re-evaluate when an unrelated state changes', async () => {
      let computeCount = 0;

      @Component({ tag: 'cmp-a' })
      class CmpA {
        @State() count = 2;
        @State() other = 0;

        @Method()
        async bumpOther() {
          this.other++;
        }

        doubled = computed(() => {
          computeCount++;
          return this.count * 2;
        });
        render() {
          return (
            <span>
              {this.doubled}
              {this.other}
            </span>
          );
        }
      }

      const { root, waitForChanges } = await newSpecPage({
        ...SIG,
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });
      computeCount = 0;
      await root.bumpOther();
      await waitForChanges();
      expect(computeCount).toBe(0);
    });
  });

  describe('slot relocation', () => {
    it('preserves signal reactivity when a component is relocated into a slot', async () => {
      // Slot relocation temporarily disconnects the inner component. The
      // isTmpDisconnected guard in disconnectedCallback must prevent signal cleanup
      // so that watchers still fire after the move.
      const watchCalls: number[] = [];

      @Component({ tag: 'cmp-inner' })
      class CmpInner {
        @State() count = 0;

        @Watch('count')
        onCountChange(newVal: number) {
          watchCalls.push(newVal);
        }

        @Method()
        async increment() {
          this.count++;
        }

        render() {
          return <span>{this.count}</span>;
        }
      }

      @Component({ tag: 'cmp-wrapper' })
      class CmpWrapper {
        render() {
          return (
            <div>
              <slot></slot>
            </div>
          );
        }
      }

      const { body, waitForChanges } = await newSpecPage({
        ...SIG,
        components: [CmpInner, CmpWrapper],
        html: `<cmp-wrapper><cmp-inner></cmp-inner></cmp-wrapper>`,
      });

      const inner = body.querySelector('cmp-inner') as any;
      await inner.increment();
      await waitForChanges();

      expect(watchCalls).toHaveLength(1);
      expect(watchCalls[0]).toBe(1);
    });
  });
});
