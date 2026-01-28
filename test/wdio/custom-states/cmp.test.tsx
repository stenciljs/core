import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('custom states', function () {
  beforeEach(async () => {
    render({
      components: [],
      template: () => <custom-states-cmp></custom-states-cmp>,
    });
  });

  it('should render without errors', async () => {
    const elm = $('custom-states-cmp');
    await expect(elm).toBePresent();
  });

  describe('initial custom states', () => {
    it('should have "open" state set initially (initialValue: true)', async () => {
      const elm = document.querySelector('custom-states-cmp') as any;
      const hasOpen = await elm.hasState('open');
      expect(hasOpen).toBe(true);
    });

    it('should NOT have "active" state set initially (initialValue: false)', async () => {
      const elm = document.querySelector('custom-states-cmp') as any;
      const hasActive = await elm.hasState('active');
      expect(hasActive).toBe(false);
    });

    it('should NOT have "disabled" state set initially (initialValue: false)', async () => {
      const elm = document.querySelector('custom-states-cmp') as any;
      const hasDisabled = await elm.hasState('disabled');
      expect(hasDisabled).toBe(false);
    });
  });

  describe('toggling custom states', () => {
    it('should add a state when toggling from false to true', async () => {
      const elm = document.querySelector('custom-states-cmp') as any;

      // active starts as false
      expect(await elm.hasState('active')).toBe(false);

      // toggle it on
      await elm.toggleState('active', true);

      // now it should be true
      expect(await elm.hasState('active')).toBe(true);
    });

    it('should remove a state when toggling from true to false', async () => {
      const elm = document.querySelector('custom-states-cmp') as any;

      // open starts as true
      expect(await elm.hasState('open')).toBe(true);

      // toggle it off
      await elm.toggleState('open', false);

      // now it should be false
      expect(await elm.hasState('open')).toBe(false);
    });

    it('should toggle state without force parameter', async () => {
      const elm = document.querySelector('custom-states-cmp') as any;

      // open starts as true
      expect(await elm.hasState('open')).toBe(true);

      // toggle without force - should become false
      await elm.toggleState('open');
      expect(await elm.hasState('open')).toBe(false);

      // toggle again - should become true
      await elm.toggleState('open');
      expect(await elm.hasState('open')).toBe(true);
    });

    it('should work with CSS :state() pseudo-class', async () => {
      const elm = $('custom-states-cmp');

      // Test that the element matches :state(open) initially
      // Note: :state() pseudo-class support varies by browser
      const matchesOpen = await elm.execute((el: Element) => {
        try {
          return el.matches(':state(open)');
        } catch {
          // Browser may not support :state() pseudo-class
          return null;
        }
      });

      // If the browser supports :state(), verify it works
      if (matchesOpen !== null) {
        expect(matchesOpen).toBe(true);

        // Toggle open off and verify CSS no longer matches
        const cmp = document.querySelector('custom-states-cmp') as any;
        await cmp.toggleState('open', false);

        const matchesOpenAfter = await elm.execute((el: Element) => {
          try {
            return el.matches(':state(open)');
          } catch {
            return null;
          }
        });
        expect(matchesOpenAfter).toBe(false);
      }
    });
  });
});
