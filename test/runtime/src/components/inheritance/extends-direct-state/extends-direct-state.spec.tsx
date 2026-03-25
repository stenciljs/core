import { describe, it, expect, render, h } from '@stencil/vitest';

/**
 * Tests for direct state manipulation from a base class.
 * Verifies that @State properties defined in a base class
 * trigger re-renders when updated, without needing requestUpdate().
 */
describe('extends-direct-state', () => {
  describe('direct state management from base class', () => {
    it('renders initial state', async () => {
      const { root } = await render(<extends-direct-state />);

      expect(root.querySelector('h2')).toHaveTextContent('Direct State Management Test');
      expect(root.querySelector('.current-time')).toBeDefined();
      expect(root.querySelector('.clock-status')).toHaveTextContent('Clock Running: Yes');
    });

    it('shows current time from base class state', async () => {
      const { root } = await render(<extends-direct-state />);

      const timeElement = root.querySelector('.current-time');
      expect(timeElement).toBeDefined();
      expect(timeElement!.textContent).toContain('Current Time:');
    });

    it('toggles clock via method', async () => {
      const { root, waitForChanges } = await render(<extends-direct-state />);

      // Initially running
      expect(root.querySelector('.clock-status')).toHaveTextContent('Clock Running: Yes');
      expect(root.querySelector('.toggle-clock')).toHaveTextContent('Stop Clock');

      // Toggle to stop
      await (root as any).toggle();
      await waitForChanges();

      expect(root.querySelector('.clock-status')).toHaveTextContent('Clock Running: No');
      expect(root.querySelector('.toggle-clock')).toHaveTextContent('Start Clock');

      // Toggle to start again
      await (root as any).toggle();
      await waitForChanges();

      expect(root.querySelector('.clock-status')).toHaveTextContent('Clock Running: Yes');
      expect(root.querySelector('.toggle-clock')).toHaveTextContent('Stop Clock');
    });

    it('toggles clock via button click', async () => {
      const { root, waitForChanges } = await render(<extends-direct-state />);

      const button = root.querySelector('.toggle-clock') as HTMLButtonElement;
      expect(button).toBeDefined();

      // Initially running
      expect(root.querySelector('.clock-status')).toHaveTextContent('Clock Running: Yes');

      // Click to stop
      button.click();
      await waitForChanges();

      expect(root.querySelector('.clock-status')).toHaveTextContent('Clock Running: No');
    });

    it('exposes state via methods', async () => {
      const { root } = await render(<extends-direct-state />);

      const isRunning = await (root as any).getIsRunning();
      expect(isRunning).toBe(true);

      const time = await (root as any).getTime();
      expect(typeof time).toBe('string');
      expect(time.length).toBeGreaterThan(0);
    });
  });
});
