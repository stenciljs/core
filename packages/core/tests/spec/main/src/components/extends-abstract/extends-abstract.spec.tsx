import { describe, it, expect, render, h } from '@stencil/vitest';

/**
 * Tests for extending from abstract base classes.
 * Verifies that decorated members (@Prop, @State, @Method, @Watch)
 * in abstract parent classes are properly inherited and reactive.
 */
describe('extends-abstract', () => {
  describe('component classes extending abstract base classes', () => {
    it('renders default values', async () => {
      const { root } = await render(<extends-abstract />);

      // Main component values (overridden defaults)
      expect(root.querySelector('.main-prop-1')).toHaveTextContent('Main class prop1: default text');
      expect(root.querySelector('.main-prop-2')).toHaveTextContent('Main class prop2: ExtendedCmp prop2 text');
      expect(root.querySelector('.main-getter-prop')).toHaveTextContent('Main class getterProp: getter default value');
      expect(root.querySelector('.main-state-1')).toHaveTextContent('Main class state1: default state text');
      expect(root.querySelector('.main-state-2')).toHaveTextContent('Main class state2: ExtendedCmp state2 text');
    });

    it('re-renders values via attributes', async () => {
      const { root, waitForChanges } = await render(<extends-abstract />);

      root.setAttribute('prop-1', 'main via attribute');
      root.setAttribute('prop-2', 'base via attribute');
      await waitForChanges();

      expect(root.querySelector('.main-prop-1')).toHaveTextContent('Main class prop1: main via attribute');
      expect(root.querySelector('.main-prop-2')).toHaveTextContent('Main class prop2: base via attribute');
    });

    it('re-renders values via props', async () => {
      const { root, waitForChanges } = await render(<extends-abstract />);

      (root as any).prop1 = 'main via prop';
      (root as any).prop2 = 'base via prop';
      await waitForChanges();

      expect(root.querySelector('.main-prop-1')).toHaveTextContent('Main class prop1: main via prop');
      expect(root.querySelector('.main-prop-2')).toHaveTextContent('Main class prop2: base via prop');
    });

    it('calls watch handlers', async () => {
      const logMessages: string[] = [];
      const originalConsoleInfo = console.info;
      console.info = (...args: any[]) => {
        logMessages.push(args.map(String).join(' '));
      };

      const { root, waitForChanges } = await render(<extends-abstract />);

      root.setAttribute('prop-1', 'main via attribute');
      root.setAttribute('prop-2', 'base via attribute');
      await waitForChanges();

      (root as any).prop1 = 'main via prop';
      (root as any).prop2 = 'base via prop';
      await waitForChanges();

      expect(logMessages).toEqual([
        'main class handler prop1: main via attribute',
        'extended class handler prop2: base via attribute',
        'main class handler prop1: main via prop',
        'extended class handler prop2: base via prop',
      ]);

      console.info = originalConsoleInfo;
    });

    it('calls methods', async () => {
      const { root, waitForChanges } = await render(<extends-abstract />);

      await (root as any).method1();
      await waitForChanges();
      expect(root.querySelector('.main-prop-1')).toHaveTextContent('Main class prop1: main class method1 called');

      await (root as any).method2();
      await waitForChanges();
      expect(root.querySelector('.main-prop-1')).toHaveTextContent('Main class prop1: ExtendedCmp method2 called');
    });
  });
});
