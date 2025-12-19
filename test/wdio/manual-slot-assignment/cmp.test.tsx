import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, browser, expect } from '@wdio/globals';

describe('manual-slot-assignment', () => {
  describe('manual-slot-tabs', () => {
    beforeEach(async () => {
      render({
        components: [],
        template: () => (
          <>
            <manual-slot-tabs>
              <div slot="tab-0" data-testid="tab-0-content">
                <h2>Tab 1 Content</h2>
                <p>This is the content for the first tab.</p>
              </div>
              <div slot="tab-1" data-testid="tab-1-content">
                <h2>Tab 2 Content</h2>
                <p>This is the content for the second tab.</p>
              </div>
              <div slot="tab-2" data-testid="tab-2-content">
                <h2>Tab 3 Content</h2>
                <p>This is the content for the third tab.</p>
              </div>
            </manual-slot-tabs>
          </>
        ),
      });
    });

    it('should render with shadow DOM using manual slot assignment', async () => {
      const cmp = $('manual-slot-tabs');
      await cmp.waitForExist();

      // Verify component has shadow root
      const hasShadowRoot = await browser.execute(() => {
        const el = document.querySelector('manual-slot-tabs');
        return el.shadowRoot !== null;
      });
      expect(hasShadowRoot).toBe(true);

      // Verify slot exists in shadow DOM
      const slotExists = await browser.execute(() => {
        const el = document.querySelector('manual-slot-tabs');
        const slot = el.shadowRoot.querySelector('slot');
        return slot !== null;
      });
      expect(slotExists).toBe(true);
    });

    it('should initially show tab 0 content', async () => {
      await $('manual-slot-tabs').waitForExist();

      // Check that tab-0 content is assigned to the slot
      const assignedNodes = await browser.execute(() => {
        const el = document.querySelector('manual-slot-tabs');
        const slot = el.shadowRoot.querySelector('slot');
        return slot.assignedElements().map((el) => el.getAttribute('data-testid'));
      });

      expect(assignedNodes).toEqual(['tab-0-content']);
    });

    it('should show only the active tab content when switching tabs', async () => {
      await $('manual-slot-tabs').waitForExist();

      // Get all tab buttons from shadow DOM
      const buttons = await browser.execute(() => {
        const el = document.querySelector('manual-slot-tabs');
        return el.shadowRoot.querySelectorAll('.tabs button').length;
      });
      expect(buttons).toBe(3);

      // Click second tab button
      await browser.execute(() => {
        const el = document.querySelector('manual-slot-tabs');
        const buttons = el.shadowRoot.querySelectorAll('.tabs button');
        (buttons[1] as HTMLButtonElement).click();
      });

      // Check that only tab-1 content is assigned
      const assignedAfterClick = await browser.execute(() => {
        const el = document.querySelector('manual-slot-tabs');
        const slot = el.shadowRoot.querySelector('slot');
        return slot.assignedElements().map((el) => el.getAttribute('data-testid'));
      });
      expect(assignedAfterClick).toEqual(['tab-1-content']);

      // Click third tab button
      await browser.execute(() => {
        const el = document.querySelector('manual-slot-tabs');
        const buttons = el.shadowRoot.querySelectorAll('.tabs button');
        (buttons[2] as HTMLButtonElement).click();
      });

      // Check that only tab-2 content is assigned
      const assignedAfterSecondClick = await browser.execute(() => {
        const el = document.querySelector('manual-slot-tabs');
        const slot = el.shadowRoot.querySelector('slot');
        return slot.assignedElements().map((el) => el.getAttribute('data-testid'));
      });
      expect(assignedAfterSecondClick).toEqual(['tab-2-content']);
    });

    it('should update active button styling when switching tabs', async () => {
      await $('manual-slot-tabs').waitForExist();

      // Check initial active state
      const initialActive = await browser.execute(() => {
        const el = document.querySelector('manual-slot-tabs');
        const buttons = el.shadowRoot.querySelectorAll('.tabs button');
        return Array.from(buttons).map((btn) => btn.classList.contains('active'));
      });
      expect(initialActive).toEqual([true, false, false]);

      // Click second tab
      await browser.execute(() => {
        const el = document.querySelector('manual-slot-tabs');
        const buttons = el.shadowRoot.querySelectorAll('.tabs button');
        (buttons[1] as HTMLButtonElement).click();
      });

      // Check active state after click
      const activeAfterClick = await browser.execute(() => {
        const el = document.querySelector('manual-slot-tabs');
        const buttons = el.shadowRoot.querySelectorAll('.tabs button');
        return Array.from(buttons).map((btn) => btn.classList.contains('active'));
      });
      expect(activeAfterClick).toEqual([false, true, false]);
    });

    it('should support programmatic tab switching via method', async () => {
      await $('manual-slot-tabs').waitForExist();

      // Use the setActiveTab method to switch to tab 2
      await browser.execute(async () => {
        const el = document.querySelector('manual-slot-tabs') as any;
        await el.setActiveTab(2);
      });

      // Verify tab-2 is assigned
      const assignedNodes = await browser.execute(() => {
        const el = document.querySelector('manual-slot-tabs');
        const slot = el.shadowRoot.querySelector('slot');
        return slot.assignedElements().map((el) => el.getAttribute('data-testid'));
      });
      expect(assignedNodes).toEqual(['tab-2-content']);

      // Verify button state
      const activeStates = await browser.execute(() => {
        const el = document.querySelector('manual-slot-tabs');
        const buttons = el.shadowRoot.querySelectorAll('.tabs button');
        return Array.from(buttons).map((btn) => btn.classList.contains('active'));
      });
      expect(activeStates).toEqual([false, false, true]);
    });
  });

  describe('manual-slot-filter', () => {
    beforeEach(async () => {
      render({
        components: [],
        template: () => (
          <>
            <manual-slot-filter>
              <div data-category="fruit" data-testid="apple">
                Apple
              </div>
              <div data-category="fruit" data-testid="banana">
                Banana
              </div>
              <div data-category="vegetable" data-testid="carrot">
                Carrot
              </div>
              <div data-category="vegetable" data-testid="broccoli">
                Broccoli
              </div>
              <div data-category="fruit" data-testid="orange">
                Orange
              </div>
            </manual-slot-filter>
          </>
        ),
      });
    });

    it('should render with shadow DOM using manual slot assignment', async () => {
      const cmp = $('manual-slot-filter');
      await cmp.waitForExist();

      // Verify component has shadow root
      const hasShadowRoot = await browser.execute(() => {
        const el = document.querySelector('manual-slot-filter');
        return el.shadowRoot !== null;
      });
      expect(hasShadowRoot).toBe(true);
    });

    it('should initially show all items', async () => {
      await $('manual-slot-filter').waitForExist();

      // Check that all items are assigned to the slot
      const assignedNodes = await browser.execute(() => {
        const el = document.querySelector('manual-slot-filter');
        const slot = el.shadowRoot.querySelector('slot');
        return slot.assignedElements().map((el) => el.getAttribute('data-testid'));
      });

      expect(assignedNodes).toEqual(['apple', 'banana', 'carrot', 'broccoli', 'orange']);
    });

    it('should filter to show only fruits', async () => {
      await $('manual-slot-filter').waitForExist();

      // Click the "Fruits" button
      await browser.execute(() => {
        const el = document.querySelector('manual-slot-filter');
        const buttons = el.shadowRoot.querySelectorAll('.controls button');
        (buttons[1] as HTMLButtonElement).click(); // Fruits button
      });

      // Check that only fruit items are assigned
      const assignedNodes = await browser.execute(() => {
        const el = document.querySelector('manual-slot-filter');
        const slot = el.shadowRoot.querySelector('slot');
        return slot.assignedElements().map((el) => el.getAttribute('data-testid'));
      });

      expect(assignedNodes).toEqual(['apple', 'banana', 'orange']);
    });

    it('should filter to show only vegetables', async () => {
      await $('manual-slot-filter').waitForExist();

      // Click the "Vegetables" button
      await browser.execute(() => {
        const el = document.querySelector('manual-slot-filter');
        const buttons = el.shadowRoot.querySelectorAll('.controls button');
        (buttons[2] as HTMLButtonElement).click(); // Vegetables button
      });

      // Check that only vegetable items are assigned
      const assignedNodes = await browser.execute(() => {
        const el = document.querySelector('manual-slot-filter');
        const slot = el.shadowRoot.querySelector('slot');
        return slot.assignedElements().map((el) => el.getAttribute('data-testid'));
      });

      expect(assignedNodes).toEqual(['carrot', 'broccoli']);
    });

    it('should switch back to showing all items', async () => {
      await $('manual-slot-filter').waitForExist();

      // Filter to fruits first
      await browser.execute(() => {
        const el = document.querySelector('manual-slot-filter');
        const buttons = el.shadowRoot.querySelectorAll('.controls button');
        (buttons[1] as HTMLButtonElement).click();
      });

      // Then click "All" button
      await browser.execute(() => {
        const el = document.querySelector('manual-slot-filter');
        const buttons = el.shadowRoot.querySelectorAll('.controls button');
        (buttons[0] as HTMLButtonElement).click();
      });

      // Check that all items are assigned again
      const assignedNodes = await browser.execute(() => {
        const el = document.querySelector('manual-slot-filter');
        const slot = el.shadowRoot.querySelector('slot');
        return slot.assignedElements().map((el) => el.getAttribute('data-testid'));
      });

      expect(assignedNodes).toEqual(['apple', 'banana', 'carrot', 'broccoli', 'orange']);
    });

    it('should update active button styling when filtering', async () => {
      await $('manual-slot-filter').waitForExist();

      // Check initial active state
      const initialActive = await browser.execute(() => {
        const el = document.querySelector('manual-slot-filter');
        const buttons = el.shadowRoot.querySelectorAll('.controls button');
        return Array.from(buttons).map((btn) => btn.classList.contains('active'));
      });
      expect(initialActive).toEqual([true, false, false]);

      // Click Vegetables filter
      await browser.execute(() => {
        const el = document.querySelector('manual-slot-filter');
        const buttons = el.shadowRoot.querySelectorAll('.controls button');
        (buttons[2] as HTMLButtonElement).click();
      });

      // Check active state after click
      const activeAfterClick = await browser.execute(() => {
        const el = document.querySelector('manual-slot-filter');
        const buttons = el.shadowRoot.querySelectorAll('.controls button');
        return Array.from(buttons).map((btn) => btn.classList.contains('active'));
      });
      expect(activeAfterClick).toEqual([false, false, true]);
    });

    it('should support programmatic filtering via method', async () => {
      await $('manual-slot-filter').waitForExist();

      // Use the setFilter method
      await browser.execute(async () => {
        const el = document.querySelector('manual-slot-filter') as any;
        await el.setFilter('fruit');
      });

      // Verify only fruits are assigned
      const assignedNodes = await browser.execute(() => {
        const el = document.querySelector('manual-slot-filter');
        const slot = el.shadowRoot.querySelector('slot');
        return slot.assignedElements().map((el) => el.getAttribute('data-testid'));
      });
      expect(assignedNodes).toEqual(['apple', 'banana', 'orange']);
    });
  });
});
