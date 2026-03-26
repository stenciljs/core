import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('manual-slot-assignment', () => {
  describe('manual-slot-tabs', () => {
    it('should render with shadow DOM using manual slot assignment', async () => {
      const { root } = await render<HTMLManualSlotTabsElement>(
        <manual-slot-tabs>
          <div slot='tab-0' data-testid='tab-0-content'>
            <h2>Tab 1 Content</h2>
            <p>This is the content for the first tab.</p>
          </div>
          <div slot='tab-1' data-testid='tab-1-content'>
            <h2>Tab 2 Content</h2>
            <p>This is the content for the second tab.</p>
          </div>
          <div slot='tab-2' data-testid='tab-2-content'>
            <h2>Tab 3 Content</h2>
            <p>This is the content for the third tab.</p>
          </div>
        </manual-slot-tabs>,
      );
      await waitForExist('manual-slot-tabs.hydrated');
      const el = root;

      // Verify component has shadow root
      expect(el.shadowRoot).not.toBeNull();

      // Verify slot exists in shadow DOM
      const slot = el.shadowRoot!.querySelector('slot');
      expect(slot).not.toBeNull();
    });

    it('should initially show tab 0 content', async () => {
      const { root } = await render<HTMLManualSlotTabsElement>(
        <manual-slot-tabs>
          <div slot='tab-0' data-testid='tab-0-content'>
            <h2>Tab 1 Content</h2>
          </div>
          <div slot='tab-1' data-testid='tab-1-content'>
            <h2>Tab 2 Content</h2>
          </div>
          <div slot='tab-2' data-testid='tab-2-content'>
            <h2>Tab 3 Content</h2>
          </div>
        </manual-slot-tabs>,
      );
      await waitForExist('manual-slot-tabs.hydrated');

      const el = root;
      const slot = el.shadowRoot!.querySelector('slot')!;
      const assignedNodes = slot.assignedElements().map((el) => el.getAttribute('data-testid'));

      expect(assignedNodes).toEqual(['tab-0-content']);
    });

    it('should show only the active tab content when switching tabs', async () => {
      const { root, waitForChanges } = await render<HTMLManualSlotTabsElement>(
        <manual-slot-tabs>
          <div slot='tab-0' data-testid='tab-0-content'>
            <h2>Tab 1 Content</h2>
          </div>
          <div slot='tab-1' data-testid='tab-1-content'>
            <h2>Tab 2 Content</h2>
          </div>
          <div slot='tab-2' data-testid='tab-2-content'>
            <h2>Tab 3 Content</h2>
          </div>
        </manual-slot-tabs>,
      );
      await waitForExist('manual-slot-tabs.hydrated');
      const el = root;

      // Get all tab buttons from shadow DOM
      const buttons = el.shadowRoot!.querySelectorAll('.tabs button');
      expect(buttons.length).toBe(3);

      // Click second tab button
      (buttons[1] as HTMLButtonElement).click();
      await waitForChanges();

      // Check that only tab-1 content is assigned
      const slot = el.shadowRoot!.querySelector('slot')!;
      let assignedNodes = slot.assignedElements().map((el) => el.getAttribute('data-testid'));
      expect(assignedNodes).toEqual(['tab-1-content']);

      // Click third tab button
      (buttons[2] as HTMLButtonElement).click();
      await waitForChanges();

      // Check that only tab-2 content is assigned
      assignedNodes = slot.assignedElements().map((el) => el.getAttribute('data-testid'));
      expect(assignedNodes).toEqual(['tab-2-content']);
    });

    it('should update active button styling when switching tabs', async () => {
      const { root, waitForChanges } = await render<HTMLManualSlotTabsElement>(
        <manual-slot-tabs>
          <div slot='tab-0' data-testid='tab-0-content'>
            Tab 1
          </div>
          <div slot='tab-1' data-testid='tab-1-content'>
            Tab 2
          </div>
          <div slot='tab-2' data-testid='tab-2-content'>
            Tab 3
          </div>
        </manual-slot-tabs>,
      );
      await waitForExist('manual-slot-tabs.hydrated');

      const el = root;
      const buttons = el.shadowRoot!.querySelectorAll('.tabs button');

      // Check initial active state
      const getActiveStates = () =>
        Array.from(buttons).map((btn) => btn.classList.contains('active'));
      expect(getActiveStates()).toEqual([true, false, false]);

      // Click second tab
      (buttons[1] as HTMLButtonElement).click();
      await waitForChanges();

      // Check active state after click
      expect(getActiveStates()).toEqual([false, true, false]);
    });

    it('should support programmatic tab switching via method', async () => {
      const { root, waitForChanges } = await render<HTMLManualSlotTabsElement>(
        <manual-slot-tabs>
          <div slot='tab-0' data-testid='tab-0-content'>
            Tab 1
          </div>
          <div slot='tab-1' data-testid='tab-1-content'>
            Tab 2
          </div>
          <div slot='tab-2' data-testid='tab-2-content'>
            Tab 3
          </div>
        </manual-slot-tabs>,
      );
      await waitForExist('manual-slot-tabs.hydrated');
      const el = root;

      // Use the setActiveTab method to switch to tab 2
      await el.setActiveTab(2);
      await waitForChanges();

      // Verify tab-2 is assigned
      const slot = el.shadowRoot!.querySelector('slot')!;
      const assignedNodes = slot
        .assignedElements()
        .map((el: Element) => el.getAttribute('data-testid'));
      expect(assignedNodes).toEqual(['tab-2-content']);

      // Verify button state
      const buttons = el.shadowRoot!.querySelectorAll('.tabs button');
      const activeStates = Array.from(buttons).map((btn: Element) =>
        btn.classList.contains('active'),
      );
      expect(activeStates).toEqual([false, false, true]);
    });
  });

  describe('manual-slot-filter', () => {
    it('should render with shadow DOM using manual slot assignment', async () => {
      const { root } = await render<HTMLManualSlotFilterElement>(
        <manual-slot-filter>
          <div data-category='fruit' data-testid='apple'>
            Apple
          </div>
          <div data-category='vegetable' data-testid='carrot'>
            Carrot
          </div>
        </manual-slot-filter>,
      );
      const el = root;

      // Verify component has shadow root
      expect(el.shadowRoot).not.toBeNull();
    });

    it('should initially show all items', async () => {
      const { root } = await render<HTMLManualSlotFilterElement>(
        <manual-slot-filter>
          <div data-category='fruit' data-testid='apple'>
            Apple
          </div>
          <div data-category='fruit' data-testid='banana'>
            Banana
          </div>
          <div data-category='vegetable' data-testid='carrot'>
            Carrot
          </div>
          <div data-category='vegetable' data-testid='broccoli'>
            Broccoli
          </div>
          <div data-category='fruit' data-testid='orange'>
            Orange
          </div>
        </manual-slot-filter>,
      );

      const el = root;
      const slot = el.shadowRoot!.querySelector('slot')!;
      const assignedNodes = slot.assignedElements().map((el) => el.getAttribute('data-testid'));

      expect(assignedNodes).toEqual(['apple', 'banana', 'carrot', 'broccoli', 'orange']);
    });

    it('should filter to show only fruits', async () => {
      const { root, waitForChanges } = await render<HTMLManualSlotFilterElement>(
        <manual-slot-filter>
          <div data-category='fruit' data-testid='apple'>
            Apple
          </div>
          <div data-category='fruit' data-testid='banana'>
            Banana
          </div>
          <div data-category='vegetable' data-testid='carrot'>
            Carrot
          </div>
          <div data-category='vegetable' data-testid='broccoli'>
            Broccoli
          </div>
          <div data-category='fruit' data-testid='orange'>
            Orange
          </div>
        </manual-slot-filter>,
      );

      const el = root;

      // Click the "Fruits" button
      const buttons = el.shadowRoot!.querySelectorAll('.controls button');
      (buttons[1] as HTMLButtonElement).click(); // Fruits button
      await waitForChanges();

      // Check that only fruit items are assigned
      const slot = el.shadowRoot!.querySelector('slot')!;
      const assignedNodes = slot.assignedElements().map((el) => el.getAttribute('data-testid'));

      expect(assignedNodes).toEqual(['apple', 'banana', 'orange']);
    });

    it('should filter to show only vegetables', async () => {
      const { root, waitForChanges } = await render<HTMLManualSlotFilterElement>(
        <manual-slot-filter>
          <div data-category='fruit' data-testid='apple'>
            Apple
          </div>
          <div data-category='fruit' data-testid='banana'>
            Banana
          </div>
          <div data-category='vegetable' data-testid='carrot'>
            Carrot
          </div>
          <div data-category='vegetable' data-testid='broccoli'>
            Broccoli
          </div>
          <div data-category='fruit' data-testid='orange'>
            Orange
          </div>
        </manual-slot-filter>,
      );

      const el = root;

      // Click the "Vegetables" button
      const buttons = el.shadowRoot!.querySelectorAll('.controls button');
      (buttons[2] as HTMLButtonElement).click(); // Vegetables button
      await waitForChanges();

      // Check that only vegetable items are assigned
      const slot = el.shadowRoot!.querySelector('slot')!;
      const assignedNodes = slot.assignedElements().map((el) => el.getAttribute('data-testid'));

      expect(assignedNodes).toEqual(['carrot', 'broccoli']);
    });

    it('should switch back to showing all items', async () => {
      const { root, waitForChanges } = await render<HTMLManualSlotFilterElement>(
        <manual-slot-filter>
          <div data-category='fruit' data-testid='apple'>
            Apple
          </div>
          <div data-category='fruit' data-testid='banana'>
            Banana
          </div>
          <div data-category='vegetable' data-testid='carrot'>
            Carrot
          </div>
          <div data-category='vegetable' data-testid='broccoli'>
            Broccoli
          </div>
          <div data-category='fruit' data-testid='orange'>
            Orange
          </div>
        </manual-slot-filter>,
      );
      await waitForExist('manual-slot-filter.hydrated');
      const el = root;
      const buttons = el.shadowRoot!.querySelectorAll('.controls button');

      // Filter to fruits first
      (buttons[1] as HTMLButtonElement).click();
      await waitForChanges();

      // Then click "All" button
      (buttons[0] as HTMLButtonElement).click();
      await waitForChanges();

      // Check that all items are assigned again
      const slot = el.shadowRoot!.querySelector('slot')!;
      const assignedNodes = slot.assignedElements().map((el) => el.getAttribute('data-testid'));

      expect(assignedNodes).toEqual(['apple', 'banana', 'carrot', 'broccoli', 'orange']);
    });

    it('should update active button styling when filtering', async () => {
      const { root, waitForChanges } = await render<HTMLManualSlotFilterElement>(
        <manual-slot-filter>
          <div data-category='fruit' data-testid='apple'>
            Apple
          </div>
          <div data-category='vegetable' data-testid='carrot'>
            Carrot
          </div>
        </manual-slot-filter>,
      );

      await waitForExist('manual-slot-filter.hydrated');
      const el = root;
      const buttons = el.shadowRoot!.querySelectorAll('.controls button');

      // Check initial active state
      const getActiveStates = () =>
        Array.from(buttons).map((btn) => btn.classList.contains('active'));
      expect(getActiveStates()).toEqual([true, false, false]);

      // Click Vegetables filter
      (buttons[2] as HTMLButtonElement).click();
      await waitForChanges();

      // Check active state after click
      expect(getActiveStates()).toEqual([false, false, true]);
    });

    it('should support programmatic filtering via method', async () => {
      const { root, waitForChanges } = await render<HTMLManualSlotFilterElement>(
        <manual-slot-filter>
          <div data-category='fruit' data-testid='apple'>
            Apple
          </div>
          <div data-category='fruit' data-testid='banana'>
            Banana
          </div>
          <div data-category='vegetable' data-testid='carrot'>
            Carrot
          </div>
          <div data-category='fruit' data-testid='orange'>
            Orange
          </div>
        </manual-slot-filter>,
      );
      await waitForExist('manual-slot-filter.hydrated');
      const el = root;

      // Use the setFilter method
      await el.setFilter('fruit');
      await waitForChanges();

      // Verify only fruits are assigned
      const slot = el.shadowRoot!.querySelector('slot')!;
      const assignedNodes = slot
        .assignedElements()
        .map((el: Element) => el.getAttribute('data-testid'));
      expect(assignedNodes).toEqual(['apple', 'banana', 'orange']);
    });
  });
});
