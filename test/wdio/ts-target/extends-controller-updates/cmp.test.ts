import { browser, expect } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';

/**
 * Tests for controller-initiated updates. Built with
 * `tsconfig-es2022.json` > `"target": "es2022"` `dist` and `dist-custom-elements` outputs.
 * 
 * Demonstrates base classes triggering host component updates via @State inheritance
 * Modeled after Lit's ClockController: https://lit.dev/docs/composition/controllers/
 */

describe('Test Case #3 – Controller-Initiated Updates (ClockController pattern)', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-controller-updates/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.current-time'), { timeout: 5000 });
    });

    it('automatically updates clock display via timer-based controller', async () => {
      // Get initial time display
      const timeElement = frameContent.querySelector('.current-time');
      const initialTime = timeElement?.textContent;
      
      expect(initialTime).toContain('Current Time:');
      
      // Wait for at least one timer update (component updates every 500ms)
      await browser.waitUntil(() => {
        const currentTime = frameContent.querySelector('.current-time')?.textContent;
        return currentTime !== initialTime;
      }, { 
        timeout: 2000,
        timeoutMsg: 'Clock should update automatically via controller'
      });
      
      // Verify the time actually changed
      const updatedTime = frameContent.querySelector('.current-time')?.textContent;
      expect(updatedTime).not.toBe(initialTime);
      expect(updatedTime).toContain('Current Time:');
    });

    it('can stop and start the clock controller', async () => {
      // Verify clock is initially running
      const statusElement = frameContent.querySelector('.clock-status');
      expect(statusElement?.textContent).toContain('Clock Running: Yes');
      
      // Stop the clock
      const toggleButton = frameContent.querySelector('.toggle-clock') as HTMLButtonElement;
      expect(toggleButton?.textContent?.trim()).toBe('Stop Clock');
      
      toggleButton?.click();
      
      // Wait for UI to update
      await browser.waitUntil(() => {
        const status = frameContent.querySelector('.clock-status')?.textContent;
        return status?.includes('Clock Running: No');
      }, { timeout: 1000 });
      
      // Verify button text changed
      expect(toggleButton?.textContent?.trim()).toBe('Start Clock');
      
      // Get current time and wait to ensure it doesn't change
      const timeBeforeWait = frameContent.querySelector('.current-time')?.textContent;
      
      // Wait 1 second - time should NOT change when stopped
      await browser.pause(1000);
      
      const timeAfterWait = frameContent.querySelector('.current-time')?.textContent;
      expect(timeAfterWait).toBe(timeBeforeWait);
      
      // Start the clock again
      toggleButton?.click();
      
      await browser.waitUntil(() => {
        const status = frameContent.querySelector('.clock-status')?.textContent;
        return status?.includes('Clock Running: Yes');
      }, { timeout: 1000 });
      
      expect(toggleButton?.textContent?.trim()).toBe('Stop Clock');
    });

    it('demonstrates requestUpdate pattern - controller requests host updates', async () => {
      // Verify the requestUpdate pattern is working (like Lit's this.host.requestUpdate())
      const initialTime = frameContent.querySelector('.current-time')?.textContent;
      const inheritanceInfo = frameContent.querySelector('.inheritance-info');
      const patternInfo = frameContent.querySelector('.pattern-info');
      
      // Verify component structure shows requestUpdate pattern
      expect(inheritanceInfo?.textContent).toContain('Simulates Lit\'s this.host.requestUpdate() pattern');
      expect(patternInfo?.textContent).toContain('@State lives on component, controller requests updates');
      
      // Verify updates via requestUpdate pattern
      await browser.waitUntil(() => {
        const currentTime = frameContent.querySelector('.current-time')?.textContent;
        return currentTime !== initialTime;
      }, { 
        timeout: 2000,
        timeoutMsg: 'Controller should request host updates via requestUpdate()'
      });
      
      const updatedTime = frameContent.querySelector('.current-time')?.textContent;
      expect(updatedTime).not.toBe(initialTime);
      expect(updatedTime).toContain('Current Time:');
      
      // This proves the requestUpdate pattern:
      // 1. Base class timer calls this.requestUpdate()
      // 2. Component implements requestUpdate() and updates its @State
      // 3. @State changes trigger host component re-render
      // 4. Same flow as Lit's this.host.requestUpdate()
    });

    it('verifies requestUpdate mechanism enables controller-initiated updates', async () => {
      // This test verifies the core mechanism: controller requests updates, component owns @State
      
      // Get reference elements
      const timeElement = frameContent.querySelector('.current-time');
      const statusElement = frameContent.querySelector('.update-info');
      
      // Verify requestUpdate pattern info
      expect(statusElement?.textContent).toContain('Base class calls requestUpdate() → Component updates @State → Re-render');
      
      // Verify that the component displays time
      expect(timeElement?.textContent).toContain('Current Time:');
      
      // Verify requestUpdate pattern works (this proves the explicit update mechanism)
      const initialTime = timeElement?.textContent;
      
      await browser.waitUntil(() => {
        const currentTime = frameContent.querySelector('.current-time')?.textContent;
        return currentTime !== initialTime;
      }, { 
        timeout: 2000,
        timeoutMsg: 'requestUpdate pattern should enable controller-initiated updates'
      });
      
      // This test passing proves that:
      // 1. Base class calls requestUpdate() via timer
      // 2. Component implements requestUpdate() and updates its own @State
      // 3. @State changes trigger host component re-renders
      // 4. The requestUpdate pattern successfully simulates Lit's this.host.requestUpdate()
      const finalTime = frameContent.querySelector('.current-time')?.textContent;
      expect(finalTime).not.toBe(initialTime);
    });
  });

  describe('es2022 custom-element output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-controller-updates/es2022.custom-element.html', 'es2022-custom-elements');
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.current-time'), { timeout: 5000 });
    });

    it('controller updates work in custom elements build', async () => {
      // Verify clock is running in custom elements build
      const initialTime = frameContent.querySelector('.current-time')?.textContent;
      
      await browser.waitUntil(() => {
        const currentTime = frameContent.querySelector('.current-time')?.textContent;
        return currentTime !== initialTime;
      }, { 
        timeout: 2000,
        timeoutMsg: 'Clock should update in custom elements build'
      });
      
      // Verify ClockController inheritance works in custom elements build
      const updatedTime = frameContent.querySelector('.current-time')?.textContent;
      expect(updatedTime).not.toBe(initialTime);
      expect(updatedTime).toContain('Current Time:');
    });
  });
});
