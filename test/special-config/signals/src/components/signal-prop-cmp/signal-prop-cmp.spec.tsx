import { getSignal, STENCIL_SIGNALS_SYMBOL } from '@stencil/core/signals';
import { render, describe, it, expect } from '@stencil/vitest';

describe('signal-prop-cmp (@Prop)', () => {
  it('renders default prop values', async () => {
    const { root } = await render<HTMLSignalPropCmpElement>(<signal-prop-cmp />);
    expect(root.querySelector('.label')).toHaveTextContent('default');
    expect(root.querySelector('.value')).toHaveTextContent('0');
  });

  it('renders initial prop values from attributes', async () => {
    const { root } = await render<HTMLSignalPropCmpElement>(
      <signal-prop-cmp label='hello' value={42} />,
    );
    expect(root.querySelector('.label')).toHaveTextContent('hello');
    expect(root.querySelector('.value')).toHaveTextContent('42');
  });

  it('re-renders when a prop changes via attribute', async () => {
    const { root, waitForChanges } = await render<HTMLSignalPropCmpElement>(<signal-prop-cmp />);

    root.setAttribute('label', 'updated');
    await waitForChanges();
    expect(root.querySelector('.label')).toHaveTextContent('updated');
  });

  it('re-renders when a prop changes via JS property', async () => {
    const { root, waitForChanges } = await render<HTMLSignalPropCmpElement>(<signal-prop-cmp />);

    root.value = 99;
    await waitForChanges();
    expect(root.querySelector('.value')).toHaveTextContent('99');
  });
});

describe('signal-prop-cmp  External Signal API', () => {
  describe('getSignal()', () => {
    it('returns a ReadonlySignal for a @Prop member', async () => {
      const { root } = await render<HTMLSignalPropCmpElement>(<signal-prop-cmp label='hi' />);
      const sig = getSignal<string>(root, 'label');
      expect(sig).not.toBeNull();
      expect(sig!.value).toBe('hi');
    });

    it('signal value updates when the prop changes', async () => {
      const { root, waitForChanges } = await render<HTMLSignalPropCmpElement>(<signal-prop-cmp />);
      const sig = getSignal<string>(root, 'label')!;

      root.setAttribute('label', 'changed');
      await waitForChanges();
      expect(sig.value).toBe('changed');
    });

    it('subscribe() fires when the prop changes', async () => {
      const { root, waitForChanges } = await render<HTMLSignalPropCmpElement>(<signal-prop-cmp />);
      const sig = getSignal<string>(root, 'label')!;

      const received: string[] = [];
      const unsub = sig.subscribe((v) => received.push(v));

      root.setAttribute('label', 'one');
      await waitForChanges();
      root.setAttribute('label', 'two');
      await waitForChanges();

      unsub();
      expect(received).toContain('one');
      expect(received).toContain('two');
    });

    it('returns null for an unknown prop name', async () => {
      const { root } = await render<HTMLSignalPropCmpElement>(<signal-prop-cmp />);
      expect(getSignal(root, 'nonExistent')).toBeNull();
    });

    it('works for numeric @Prop', async () => {
      const { root, waitForChanges } = await render<HTMLSignalPropCmpElement>(
        <signal-prop-cmp value={7} />,
      );
      const sig = getSignal<number>(root, 'value')!;

      expect(sig.value).toBe(7);
      root.value = 42;
      await waitForChanges();
      expect(sig.value).toBe(42);
    });
  });

  describe('STENCIL_SIGNALS_SYMBOL', () => {
    it('exposes a Map on the host element with @Prop entries', async () => {
      const { root } = await render<HTMLSignalPropCmpElement>(
        <signal-prop-cmp label='x' value={3} />,
      );
      const map = (root as any)[STENCIL_SIGNALS_SYMBOL] as Map<string, any>;

      expect(map).toBeInstanceOf(Map);
      expect(map.has('label')).toBe(true);
      expect(map.has('value')).toBe(true);
    });

    it('signal in the map reflects the current prop value', async () => {
      const { root, waitForChanges } = await render<HTMLSignalPropCmpElement>(
        <signal-prop-cmp label='init' />,
      );
      const map = root[STENCIL_SIGNALS_SYMBOL];
      const sig = map?.get('label');

      expect(sig?.value).toBe('init');
      root.setAttribute('label', 'mutated');
      await waitForChanges();
      expect(sig?.value).toBe('mutated');
    });
  });
});
