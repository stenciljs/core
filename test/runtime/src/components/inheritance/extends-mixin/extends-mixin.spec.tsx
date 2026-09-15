import { describe, it, expect, render, h } from '@stencil/vitest';

/**
 * Tests for the Mixin() helper factory pattern.
 * Verifies that decorated members (@Prop, @State, @Method, @Watch)
 * from multiple mixin factories are properly merged and reactive.
 */
describe('extends-mixin', () => {
  describe('component classes using Mixin() helper with multiple factories', () => {
    it('renders default values from all mixins', async () => {
      const { root } = await render(<extends-mixin-cmp />);

      // Main component values (overridden defaults)
      expect(root.querySelector('.main-prop-1')).toHaveTextContent(
        'Main class prop1: default text',
      );
      expect(root.querySelector('.main-state-1')).toHaveTextContent(
        'Main class state1: default state text',
      );

      // MixinA values
      expect(root.querySelector('.main-prop-2')).toHaveTextContent(
        'Main class prop2: ExtendedCmp prop2 text',
      );
      expect(root.querySelector('.main-state-2')).toHaveTextContent(
        'Main class state2: ExtendedCmp state2 text',
      );

      // MixinB values
      expect(root.querySelector('.main-prop-3')).toHaveTextContent(
        'Main class prop3: mixin b text',
      );
      expect(root.querySelector('.main-getter-prop')).toHaveTextContent(
        'Main class getterProp: getter default value',
      );
      expect(root.querySelector('.main-state-3')).toHaveTextContent(
        'Main class state3: mixin b state text',
      );
    });

    it('re-renders values via attributes', async () => {
      const { root, waitForChanges } = await render(<extends-mixin-cmp />);

      root.setAttribute('prop-1', 'main via attribute');
      root.setAttribute('prop-2', 'mixinA via attribute');
      root.setAttribute('prop-3', 'mixinB via attribute');
      await waitForChanges();

      expect(root.querySelector('.main-prop-1')).toHaveTextContent(
        'Main class prop1: main via attribute',
      );
      expect(root.querySelector('.main-prop-2')).toHaveTextContent(
        'Main class prop2: mixinA via attribute',
      );
      expect(root.querySelector('.main-prop-3')).toHaveTextContent(
        'Main class prop3: mixinB via attribute',
      );
    });

    it('re-renders values via props', async () => {
      const { root, waitForChanges } = await render(<extends-mixin-cmp />);

      (root as any).prop1 = 'main via prop';
      (root as any).prop2 = 'mixinA via prop';
      (root as any).prop3 = 'mixinB via prop';
      await waitForChanges();

      expect(root.querySelector('.main-prop-1')).toHaveTextContent(
        'Main class prop1: main via prop',
      );
      expect(root.querySelector('.main-prop-2')).toHaveTextContent(
        'Main class prop2: mixinA via prop',
      );
      expect(root.querySelector('.main-prop-3')).toHaveTextContent(
        'Main class prop3: mixinB via prop',
      );
    });

    it('calls watch handlers from all mixins', async () => {
      const logMessages: string[] = [];
      const originalConsoleInfo = console.info;
      console.info = (...args: any[]) => {
        logMessages.push(args.map(String).join(' '));
      };

      const { root, waitForChanges } = await render(<extends-mixin-cmp />);

      root.setAttribute('prop-1', 'main via attribute');
      root.setAttribute('prop-2', 'mixinA via attribute');
      root.setAttribute('prop-3', 'mixinB via attribute');
      await waitForChanges();

      expect(logMessages).toContain('main class handler prop1: main via attribute');
      expect(logMessages).toContain('extended class handler prop2: mixinA via attribute');
      expect(logMessages).toContain('mixin b handler prop3: mixinB via attribute');

      console.info = originalConsoleInfo;
    });

    it('calls methods from all mixins', async () => {
      const { root, waitForChanges } = await render(<extends-mixin-cmp />);

      // Main class method (overrides MixinA)
      await (root as any).method1();
      await waitForChanges();
      expect(root.querySelector('.main-prop-1')).toHaveTextContent(
        'Main class prop1: main class method1 called',
      );

      // MixinA method
      await (root as any).method2();
      await waitForChanges();
      expect(root.querySelector('.main-prop-1')).toHaveTextContent(
        'Main class prop1: ExtendedCmp method2 called',
      );

      // MixinB method
      await (root as any).method3();
      await waitForChanges();
      expect(root.querySelector('.main-prop-3')).toHaveTextContent(
        'Main class prop3: mixin b method3 called',
      );
    });
  });
});
