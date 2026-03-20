import { render, h, describe, it, expect } from '@stencil/vitest';

describe('custom states', () => {
  it('should render without errors', async () => {
    const { root } = await render(<custom-states-cmp />);
    expect(root).toBeTruthy();
  });

  describe('initial custom states', () => {
    it('should have "open" state set initially (initialValue: true)', async () => {
      const { root } = await render(<custom-states-cmp />);
      const cmp = root as HTMLCustomStatesCmpElement;
      const hasOpen = await cmp.hasState('open');
      expect(hasOpen).toBe(true);
    });

    it('should NOT have "active" state set initially (initialValue: false)', async () => {
      const { root } = await render(<custom-states-cmp />);
      const cmp = root as HTMLCustomStatesCmpElement;
      const hasActive = await cmp.hasState('active');
      expect(hasActive).toBe(false);
    });

    it('should NOT have "disabled" state set initially (initialValue: false)', async () => {
      const { root } = await render(<custom-states-cmp />);
      const cmp = root as HTMLCustomStatesCmpElement;
      const hasDisabled = await cmp.hasState('disabled');
      expect(hasDisabled).toBe(false);
    });
  });

  describe('toggling custom states', () => {
    it('should add a state when toggling from false to true', async () => {
      const { root } = await render(<custom-states-cmp />);
      const cmp = root as HTMLCustomStatesCmpElement;

      // active starts as false
      expect(await cmp.hasState('active')).toBe(false);

      // toggle it on
      await cmp.toggleState('active', true);

      // now it should be true
      expect(await cmp.hasState('active')).toBe(true);
    });

    it('should remove a state when toggling from true to false', async () => {
      const { root } = await render(<custom-states-cmp />);
      const cmp = root as HTMLCustomStatesCmpElement;

      // open starts as true
      expect(await cmp.hasState('open')).toBe(true);

      // toggle it off
      await cmp.toggleState('open', false);

      // now it should be false
      expect(await cmp.hasState('open')).toBe(false);
    });

    it('should toggle state without force parameter', async () => {
      const { root } = await render(<custom-states-cmp />);
      const cmp = root as HTMLCustomStatesCmpElement;

      // open starts as true
      expect(await cmp.hasState('open')).toBe(true);

      // toggle without force - should become false
      await cmp.toggleState('open');
      expect(await cmp.hasState('open')).toBe(false);

      // toggle again - should become true
      await cmp.toggleState('open');
      expect(await cmp.hasState('open')).toBe(true);
    });

    it('should work with CSS :state() pseudo-class', async () => {
      const { root } = await render(<custom-states-cmp />);
      const cmp = root as HTMLCustomStatesCmpElement;

      // Test that the element matches :state(open) initially
      expect(root.matches(':state(open)')).toBe(true);

      // Toggle open off and verify CSS no longer matches
      await cmp.toggleState('open', false);

      expect(root.matches(':state(open)')).toBe(false);
    });
  });
});
