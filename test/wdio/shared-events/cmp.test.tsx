import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('shared-events', () => {
  beforeAll(async () => {
    render({
      components: [],
      template: () => (
        <div>
          <parent-a></parent-a>
          <hr />
          <unrelated-e></unrelated-e>
        </div>
      ),
    });
  });

  // Clear events before each test to start fresh
  beforeEach(async () => {
    await $('#a-clear').click();
    await $('#e-clear').click();
    // Clear child components to prevent memory accumulation
    const bClear = await $('#b-clear');
    if (await bClear.isExisting()) await bClear.click();
    const cClear = await $('#c-clear');
    if (await cClear.isExisting()) await cClear.click();
    const dClear = await $('#d-clear');
    if (await dClear.isExisting()) await dClear.click();
  });

  // Clear events after each test to prevent memory leaks
  afterEach(async () => {
    await $('#a-clear').click();
    await $('#e-clear').click();
  });

  describe('Memory-optimized event communication', () => {
    it('should render components and handle basic A→B communication', async () => {
      // Verify components rendered
      await expect($('parent-a')).toBePresent();
      await expect($('unrelated-e')).toBePresent();

      // Test A→B communication
      await $('#a-to-b').click();
      await expect($('#sibling-b-events')).toHaveAttribute('data-event-count', '1');
    });

    it('should handle shared event propagation across all components', async () => {
      // Fire shared event from Parent A
      await $('#a-shared').click();

      // All components should receive the shared event
      await expect($('#event-count')).toContain('Events received: 1');
      await expect($('#sibling-b-events')).toHaveAttribute('data-event-count', '1');
      await expect($('#sibling-c-events')).toHaveAttribute('data-event-count', '1');
      await expect($('#unrelated-e-events')).toHaveAttribute('data-event-count', '1');
    });

    it('should handle cross-family communication and clear functionality', async () => {
      // Test A→E and E→A communication
      await $('#a-to-e').click();
      await $('#e-to-a').click();

      // Both should receive events
      await expect($('#event-count')).toContain('Events received: 1');
      await expect($('#unrelated-e-events')).toHaveAttribute('data-event-count', '1');

      // Test clear functionality
      await $('#a-clear').click();
      await expect($('#event-count')).toContain('Events received: 0');
    });
  });
});
