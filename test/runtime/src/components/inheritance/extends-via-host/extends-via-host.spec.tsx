import { describe, it, expect, render, h, beforeEach } from '@stencil/vitest';

/**
 * Tests for reactive controller pattern via host extension.
 * Verifies that extending ReactiveControllerHost allows components
 * to use controllers that hook into lifecycle and request updates.
 */
describe('extends-via-host', () => {
  beforeEach(() => {
    // Clean up global flags from previous tests
    delete (window as any).__mouseControllerConnected;
    delete (window as any).__mouseControllerDisconnected;
  });

  describe('reactive controller host pattern', () => {
    it('renders initial state', async () => {
      const { root } = await render(<extends-via-host-cmp />);

      expect(root.querySelector('h3')).toHaveTextContent('The mouse is at:');
      expect(root.querySelector('.mouse-position')).toBeDefined();
    });

    it('controller hostConnected is called', async () => {
      await render(<extends-via-host-cmp />);

      // The controller should have called hostConnected
      expect((window as any).__mouseControllerConnected).toBe(true);
    });

    it('component lifecycle methods are called', async () => {
      const { root } = await render(<extends-via-host-cmp />);

      const lifecycleInfo = root.querySelector('.lifecycle-info');
      expect(lifecycleInfo).toHaveTextContent('componentWillLoad');
      expect(lifecycleInfo).toHaveTextContent('componentDidLoad');
    });

    it('controller responds to mouse events', async () => {
      const { root, waitForChanges } = await render(<extends-via-host-cmp />);

      // Simulate a mouse move event
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }));
      await waitForChanges();

      const mousePosition = root.querySelector('.mouse-position');
      expect(mousePosition).toHaveTextContent('x: 100');
      expect(mousePosition).toHaveTextContent('y: 200');
    });

    it('controller hostDisconnected is called on removal', async () => {
      const { root } = await render(<extends-via-host-cmp />);

      // Remove the component from the DOM
      root.remove();

      // The controller should have called hostDisconnected
      expect((window as any).__mouseControllerDisconnected).toBe(true);
    });
  });
});
