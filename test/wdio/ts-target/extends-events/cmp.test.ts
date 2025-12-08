import { browser, expect } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';

/**
 * Tests for @Listen decorator inheritance through extends.
 * Built with `tsconfig-es2022.json` > `"target": "es2022"` `dist` and `dist-custom-elements` outputs.
 * 
 * Test Case #10 - Event Handling Inheritance
 * Features:
 * - @Listen decorator inheritance from base class
 * - Multiple @Listen decorators at different inheritance levels
 * - Global vs Local listeners (window, document, host)
 * - Event handler override behavior
 * - Event bubbling and propagation
 */

describe('Test Case #10 – Event Handling Inheritance (@Listen decorators)', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-events/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.event-info'), { timeout: 5000 });
    });

    it('inherits base class window listener', async () => {
      const button = frameContent.querySelector('.trigger-base-window') as HTMLButtonElement;
      const baseEventsEl = frameContent.querySelector('.base-events');
      
      // Get initial count from DOM
      const initialText = baseEventsEl?.textContent || '';
      const initialMatch = initialText.match(/Base Events: (\d+)/);
      const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;
      
      // Trigger event
      button?.click();
      
      // Wait for event to be processed and DOM to update
      await browser.waitUntil(async () => {
        const updatedText = baseEventsEl?.textContent || '';
        const updatedMatch = updatedText.match(/Base Events: (\d+)/);
        const updatedCount = updatedMatch ? parseInt(updatedMatch[1], 10) : 0;
        return updatedCount > initialCount;
      }, { timeout: 3000 });
      
      // Verify event was handled
      const finalText = baseEventsEl?.textContent || '';
      const finalMatch = finalText.match(/Base Events: (\d+)/);
      const finalCount = finalMatch ? parseInt(finalMatch[1], 10) : 0;
      expect(finalCount).toBeGreaterThan(initialCount);
      
      // Verify event appears in log
      const eventLog = frameContent.querySelector('#event-log-list');
      expect(eventLog?.textContent).toContain('base-window-event');
    });

    it('inherits base class document listener', async () => {
      const button = frameContent.querySelector('.trigger-base-document') as HTMLButtonElement;
      const baseEventsEl = frameContent.querySelector('.base-events');
      
      const initialText = baseEventsEl?.textContent || '';
      const initialMatch = initialText.match(/Base Events: (\d+)/);
      const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;
      
      button?.click();
      
      await browser.waitUntil(async () => {
        const updatedText = baseEventsEl?.textContent || '';
        const updatedMatch = updatedText.match(/Base Events: (\d+)/);
        const updatedCount = updatedMatch ? parseInt(updatedMatch[1], 10) : 0;
        return updatedCount > initialCount;
      }, { timeout: 3000 });
      
      const finalText = baseEventsEl?.textContent || '';
      const finalMatch = finalText.match(/Base Events: (\d+)/);
      const finalCount = finalMatch ? parseInt(finalMatch[1], 10) : 0;
      expect(finalCount).toBeGreaterThan(initialCount);
      
      const eventLog = frameContent.querySelector('#event-log-list');
      expect(eventLog?.textContent).toContain('base-document-event');
    });

    it('inherits base class host listener', async () => {
      const button = frameContent.querySelector('.trigger-base-host') as HTMLButtonElement;
      const baseEventsEl = frameContent.querySelector('.base-events');
      
      const initialText = baseEventsEl?.textContent || '';
      const initialMatch = initialText.match(/Base Events: (\d+)/);
      const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;
      
      button?.click();
      
      await browser.waitUntil(async () => {
        const updatedText = baseEventsEl?.textContent || '';
        const updatedMatch = updatedText.match(/Base Events: (\d+)/);
        const updatedCount = updatedMatch ? parseInt(updatedMatch[1], 10) : 0;
        return updatedCount > initialCount;
      }, { timeout: 3000 });
      
      const finalText = baseEventsEl?.textContent || '';
      const finalMatch = finalText.match(/Base Events: (\d+)/);
      const finalCount = finalMatch ? parseInt(finalMatch[1], 10) : 0;
      expect(finalCount).toBeGreaterThan(initialCount);
      
      const eventLog = frameContent.querySelector('#event-log-list');
      expect(eventLog?.textContent).toContain('base-host-event');
    });

    it('handles child class window listener', async () => {
      const button = frameContent.querySelector('.trigger-child-window') as HTMLButtonElement;
      const childEventsEl = frameContent.querySelector('.child-events');
      
      const initialText = childEventsEl?.textContent || '';
      const initialMatch = initialText.match(/Child Events: (\d+)/);
      const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;
      
      button?.click();
      
      await browser.waitUntil(async () => {
        const updatedText = childEventsEl?.textContent || '';
        const updatedMatch = updatedText.match(/Child Events: (\d+)/);
        const updatedCount = updatedMatch ? parseInt(updatedMatch[1], 10) : 0;
        return updatedCount > initialCount;
      }, { timeout: 3000 });
      
      const finalText = childEventsEl?.textContent || '';
      const finalMatch = finalText.match(/Child Events: (\d+)/);
      const finalCount = finalMatch ? parseInt(finalMatch[1], 10) : 0;
      expect(finalCount).toBeGreaterThan(initialCount);
      
      const eventLog = frameContent.querySelector('#event-log-list');
      expect(eventLog?.textContent).toContain('child-window-event');
    });

    it('handles child class document listener', async () => {
      const button = frameContent.querySelector('.trigger-child-document') as HTMLButtonElement;
      const childEventsEl = frameContent.querySelector('.child-events');
      
      const initialText = childEventsEl?.textContent || '';
      const initialMatch = initialText.match(/Child Events: (\d+)/);
      const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;
      
      button?.click();
      
      await browser.waitUntil(async () => {
        const updatedText = childEventsEl?.textContent || '';
        const updatedMatch = updatedText.match(/Child Events: (\d+)/);
        const updatedCount = updatedMatch ? parseInt(updatedMatch[1], 10) : 0;
        return updatedCount > initialCount;
      }, { timeout: 3000 });
      
      const finalText = childEventsEl?.textContent || '';
      const finalMatch = finalText.match(/Child Events: (\d+)/);
      const finalCount = finalMatch ? parseInt(finalMatch[1], 10) : 0;
      expect(finalCount).toBeGreaterThan(initialCount);
      
      const eventLog = frameContent.querySelector('#event-log-list');
      expect(eventLog?.textContent).toContain('child-document-event');
    });

    it('handles child class host listener', async () => {
      const button = frameContent.querySelector('.trigger-child-host') as HTMLButtonElement;
      const childEventsEl = frameContent.querySelector('.child-events');
      
      const initialText = childEventsEl?.textContent || '';
      const initialMatch = initialText.match(/Child Events: (\d+)/);
      const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;
      
      button?.click();
      
      await browser.waitUntil(async () => {
        const updatedText = childEventsEl?.textContent || '';
        const updatedMatch = updatedText.match(/Child Events: (\d+)/);
        const updatedCount = updatedMatch ? parseInt(updatedMatch[1], 10) : 0;
        return updatedCount > initialCount;
      }, { timeout: 3000 });
      
      const finalText = childEventsEl?.textContent || '';
      const finalMatch = finalText.match(/Child Events: (\d+)/);
      const finalCount = finalMatch ? parseInt(finalMatch[1], 10) : 0;
      expect(finalCount).toBeGreaterThan(initialCount);
      
      const eventLog = frameContent.querySelector('#event-log-list');
      expect(eventLog?.textContent).toContain('child-host-event');
    });

    it('child override event handler takes precedence over base', async () => {
      const button = frameContent.querySelector('.trigger-override') as HTMLButtonElement;
      const eventLog = frameContent.querySelector('#event-log-list');
      
      // Get initial log content
      const initialLogContent = eventLog?.textContent || '';
      
      button?.click();
      
      // Wait for event processing and DOM update
      await browser.waitUntil(async () => {
        const updatedLogContent = eventLog?.textContent || '';
        return updatedLogContent.length > initialLogContent.length;
      }, { timeout: 3000 });
      
      // Verify child handler was called (override behavior)
      const finalLogContent = eventLog?.textContent || '';
      expect(finalLogContent).toContain('override-event:child');
      
      // Verify base handler was NOT called (override takes precedence)
      // Count occurrences of 'override-event:base' - should be 0 (or same as initial)
      const baseOverrideMatches = (finalLogContent.match(/override-event:base/g) || []).length;
      const initialBaseOverrideMatches = (initialLogContent.match(/override-event:base/g) || []).length;
      expect(baseOverrideMatches).toBe(initialBaseOverrideMatches);
    });

    it('handles event bubbling correctly', async () => {
      const button = frameContent.querySelector('.trigger-bubble') as HTMLButtonElement;
      const childEventsEl = frameContent.querySelector('.child-events');
      const eventLog = frameContent.querySelector('#event-log-list');
      
      const initialText = childEventsEl?.textContent || '';
      const initialMatch = initialText.match(/Child Events: (\d+)/);
      const initialCount = initialMatch ? parseInt(initialMatch[1], 10) : 0;
      
      button?.click();
      
      await browser.waitUntil(async () => {
        const updatedText = childEventsEl?.textContent || '';
        const updatedMatch = updatedText.match(/Child Events: (\d+)/);
        const updatedCount = updatedMatch ? parseInt(updatedMatch[1], 10) : 0;
        return updatedCount > initialCount;
      }, { timeout: 3000 });
      
      const finalLogContent = eventLog?.textContent || '';
      expect(finalLogContent).toContain('bubble-event:child');
    });

    it('tracks events in combined event log', async () => {
      const totalEventsEl = frameContent.querySelector('.total-events');
      const eventLog = frameContent.querySelector('#event-log-list');
      
      // Trigger multiple events
      const baseWindowBtn = frameContent.querySelector('.trigger-base-window') as HTMLButtonElement;
      const childWindowBtn = frameContent.querySelector('.trigger-child-window') as HTMLButtonElement;
      const baseHostBtn = frameContent.querySelector('.trigger-base-host') as HTMLButtonElement;
      
      baseWindowBtn?.click();
      await browser.pause(100);
      childWindowBtn?.click();
      await browser.pause(100);
      baseHostBtn?.click();
      
      // Wait for all events to process
      await browser.waitUntil(async () => {
        const totalText = totalEventsEl?.textContent || '';
        const totalMatch = totalText.match(/Total Events: (\d+)/);
        const totalCount = totalMatch ? parseInt(totalMatch[1], 10) : 0;
        return totalCount >= 3;
      }, { timeout: 3000 });
      
      const finalLogContent = eventLog?.textContent || '';
      
      expect(finalLogContent).toContain('base-window-event');
      expect(finalLogContent).toContain('child-window-event');
      expect(finalLogContent).toContain('base-host-event');
    });
  });

  describe('es2022 custom-element output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-events/es2022.custom-element.html', 'es2022-custom-elements');
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.event-info'), { timeout: 5000 });
    });

    it('inherits @Listen decorators in custom elements build', async () => {
      const component = frameContent.querySelector<any>('extends-events');
      const button = frameContent.querySelector('.trigger-base-window') as HTMLButtonElement;
      
      const initialCount = component?.baseGlobalEventCount || 0;
      
      button?.click();
      
      await browser.waitUntil(async () => {
        const count = component?.baseGlobalEventCount || 0;
        return count > initialCount;
      }, { timeout: 3000 });
      
      const finalCount = component?.baseGlobalEventCount || 0;
      expect(finalCount).toBeGreaterThan(initialCount);
    });

    it('handles child @Listen decorators in custom elements build', async () => {
      const component = frameContent.querySelector<any>('extends-events');
      const button = frameContent.querySelector('.trigger-child-host') as HTMLButtonElement;
      
      const initialCount = component?.childLocalEventCount || 0;
      
      button?.click();
      
      await browser.waitUntil(async () => {
        const count = component?.childLocalEventCount || 0;
        return count > initialCount;
      }, { timeout: 3000 });
      
      const finalCount = component?.childLocalEventCount || 0;
      expect(finalCount).toBeGreaterThan(initialCount);
    });
  });
});

