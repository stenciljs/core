import { describe, it, expect, render, h, beforeEach } from '@stencil/vitest';

/**
 * Tests for multi-level lifecycle inheritance.
 * Verifies that lifecycle methods in inheritance chains
 * (Component -> ParentBase -> GrandparentBase) are called
 * in the correct order when using super() calls.
 */
describe('extends-lifecycle-multilevel', () => {
  beforeEach(() => {
    // Clean up lifecycle tracking from previous tests
    (window as any).lifecycleCalls = [];
  });

  describe('multi-level lifecycle inheritance', () => {
    it('renders initial state', async () => {
      const { root } = await render(<extends-lifecycle-multilevel />);

      expect(root.querySelector('.current-value')).toHaveTextContent('Current Value:');
      expect(root.querySelector('h2')).toHaveTextContent('Multi-Level Lifecycle Inheritance Test');
    });

    it('calls componentWillLoad in correct order (grandparent first)', async () => {
      await render(<extends-lifecycle-multilevel />);

      const calls = (window as any).lifecycleCalls as string[];
      const willLoadCalls = calls.filter((c: string) => c.includes('componentWillLoad'));

      expect(willLoadCalls).toEqual([
        'GrandparentBase.componentWillLoad',
        'ParentBase.componentWillLoad',
        'Component.componentWillLoad',
      ]);
    });

    it('calls componentDidLoad in correct order (grandparent first)', async () => {
      await render(<extends-lifecycle-multilevel />);

      const calls = (window as any).lifecycleCalls as string[];
      const didLoadCalls = calls.filter((c: string) => c.includes('componentDidLoad'));

      expect(didLoadCalls).toEqual([
        'GrandparentBase.componentDidLoad',
        'ParentBase.componentDidLoad',
        'Component.componentDidLoad',
      ]);
    });

    it('calls componentWillRender in correct order', async () => {
      await render(<extends-lifecycle-multilevel />);

      const calls = (window as any).lifecycleCalls as string[];
      const willRenderCalls = calls.filter((c: string) => c.includes('componentWillRender'));

      expect(willRenderCalls).toEqual([
        'GrandparentBase.componentWillRender',
        'ParentBase.componentWillRender',
        'Component.componentWillRender',
      ]);
    });

    it('calls update lifecycle methods on state change', async () => {
      const { root, waitForChanges } = await render(<extends-lifecycle-multilevel />);

      // Clear initial calls
      (window as any).lifecycleCalls = [];

      // Trigger an update
      await (root as any).triggerUpdate();
      await waitForChanges();

      const calls = (window as any).lifecycleCalls as string[];

      // Should have update lifecycle calls
      expect(calls).toContain('GrandparentBase.componentWillUpdate');
      expect(calls).toContain('ParentBase.componentWillUpdate');
      expect(calls).toContain('Component.componentWillUpdate');
      expect(calls).toContain('GrandparentBase.componentDidUpdate');
      expect(calls).toContain('ParentBase.componentDidUpdate');
      expect(calls).toContain('Component.componentDidUpdate');
    });

    it('updates value via method', async () => {
      const { root, waitForChanges } = await render(<extends-lifecycle-multilevel />);

      await (root as any).triggerUpdate();
      await waitForChanges();

      expect(root.querySelector('.current-value')).toHaveTextContent('Current Value: updated');
    });
  });
});
