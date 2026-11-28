import { describe, it, expect, render, h, beforeEach } from '@stencil/vitest';

declare global {
  interface Window {
    lifecycleCalls?: string[];
  }
}

describe('extends-lifecycle-basic', () => {
  beforeEach(() => {
    // Reset lifecycle tracking before each test
    window.lifecycleCalls = [];
  });

  describe('Lifecycle Inheritance (Load, Render, Update)', () => {
    it('inherits componentWillLoad from LifecycleBase', async () => {
      await render(<extends-lifecycle-basic />);

      expect(window.lifecycleCalls).toContain('componentWillLoad');
    });

    it('inherits componentDidLoad from LifecycleBase', async () => {
      await render(<extends-lifecycle-basic />);

      expect(window.lifecycleCalls).toContain('componentDidLoad');
    });

    it('inherits componentWillRender from LifecycleBase', async () => {
      await render(<extends-lifecycle-basic />);

      expect(window.lifecycleCalls).toContain('componentWillRender');
    });

    it('inherits componentDidRender from LifecycleBase', async () => {
      await render(<extends-lifecycle-basic />);

      expect(window.lifecycleCalls).toContain('componentDidRender');
    });

    it('inherits update lifecycle on state change', async () => {
      const { root, waitForChanges } = await render(<extends-lifecycle-basic />);

      // Verify update lifecycle events don't exist yet
      expect(window.lifecycleCalls).not.toContain('componentWillUpdate');
      expect(window.lifecycleCalls).not.toContain('componentDidUpdate');

      // Trigger update
      root.querySelector<HTMLButtonElement>('.trigger-update')!.click();
      await waitForChanges();

      // Verify value changed
      expect(root.querySelector('.current-value')).toHaveTextContent('updated');

      // Verify update lifecycle events were tracked
      expect(window.lifecycleCalls).toContain('componentWillUpdate');
      expect(window.lifecycleCalls).toContain('componentDidUpdate');
    });
  });
});
