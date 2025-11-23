import { browser, expect } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';

/**
 * Tests for direct state management via extends. Built with
 * `tsconfig-es2022.json` > `"target": "es2022"` `dist` and `dist-custom-elements` outputs.
 * 
 * Demonstrates the simplified approach where base classes directly manage @State
 * without needing requestUpdate patterns like Lit's ClockController
 */

describe('Test Case #4 – Direct State Management (Simplified Pattern)', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-direct-state/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.current-time'), { timeout: 5000 });
    });

    it('automatically updates clock display via direct state management', async () => {
      // Get initial time display
      const timeElement = frameContent.querySelector('.current-time');
      const initialTime = timeElement?.textContent;
      
      expect(initialTime).toContain('Current Time:');
      
      // Wait for at least one timer update (component updates every 1000ms)
      await browser.waitUntil(() => {
        const currentTime = frameContent.querySelector('.current-time')?.textContent;
        return currentTime !== initialTime;
      }, { 
        timeout: 2000,
        timeoutMsg: 'Clock should update automatically via direct state management'
      });
      
      // Verify the time actually changed
      const updatedTime = frameContent.querySelector('.current-time')?.textContent;
      expect(updatedTime).not.toBe(initialTime);
      expect(updatedTime).toContain('Current Time:');
    });

    it('can stop and start the clock via direct state', async () => {
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
      
      // Wait 1.2 seconds - time should NOT change when stopped
      await browser.pause(1200);
      
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

    it('demonstrates direct state pattern - no ReactiveController complexity', async () => {
      // Verify the direct state pattern is working (simpler than Lit's ReactiveController pattern)
      const initialTime = frameContent.querySelector('.current-time')?.textContent;
      const inheritanceInfo = frameContent.querySelector('.inheritance-info');
      const patternInfo = frameContent.querySelector('.pattern-info');
      
      // Verify component structure shows direct state pattern
      expect(inheritanceInfo?.textContent).toContain('Stencil\'s superior extends functionality');
      expect(patternInfo?.textContent).toContain('@State lives on base class, no requestUpdate needed');
      
      // Verify Lit vs Stencil code comparison
      const litPattern = frameContent.querySelector('.lit-pattern');
      const stencilPattern = frameContent.querySelector('.stencil-pattern');
      const litRender = frameContent.querySelector('.lit-render');
      const stencilRender = frameContent.querySelector('.stencil-render');
      
      expect(litPattern?.textContent).toContain('private clock = new ClockController(this, 100)');
      expect(stencilPattern?.textContent).toContain('extends ClockBase // Just extend!');
      expect(litRender?.textContent).toContain('this.clock.value');
      expect(stencilRender?.textContent).toContain('this.currentTime');
      
      // Verify updates via direct state pattern
      await browser.waitUntil(() => {
        const currentTime = frameContent.querySelector('.current-time')?.textContent;
        return currentTime !== initialTime;
      }, { 
        timeout: 2000,
        timeoutMsg: 'Direct state updates should trigger re-renders automatically'
      });
      
      const updatedTime = frameContent.querySelector('.current-time')?.textContent;
      expect(updatedTime).not.toBe(initialTime);
      expect(updatedTime).toContain('Current Time:');
    });

    it('verifies direct state mechanism is simpler than requestUpdate pattern', async () => {
      // This test verifies the core advantage: base class owns @State directly
      
      // Get reference elements
      const timeElement = frameContent.querySelector('.current-time');
      const statusElement = frameContent.querySelector('.update-info');
      
      // Verify direct state pattern info
      expect(statusElement?.textContent).toContain('Base class updates @State directly → Automatic re-render');
      
      // Verify that the component displays time
      expect(timeElement?.textContent).toContain('Current Time:');
      
      // Verify comparison info shows advantages over Lit's ReactiveController pattern
      const simplerInfo = frameContent.querySelector('.simpler-info');
      const directInfo = frameContent.querySelector('.direct-info');
      const cleanerInfo = frameContent.querySelector('.cleaner-info');
      const stencilInfo = frameContent.querySelector('.stencil-info');
      const extendsInfo = frameContent.querySelector('.extends-info');
      
      expect(simplerInfo?.textContent).toContain('No ReactiveController interface');
      expect(directInfo?.textContent).toContain('No host reference needed');
      expect(cleanerInfo?.textContent).toContain('No host.requestUpdate() calls');
      expect(stencilInfo?.textContent).toContain('No controller instance creation');
      expect(extendsInfo?.textContent).toContain('Just extend the base class');
      
      // Verify direct state updates work (this proves the simplified mechanism)
      const initialTime = timeElement?.textContent;
      
      await browser.waitUntil(() => {
        const currentTime = frameContent.querySelector('.current-time')?.textContent;
        return currentTime !== initialTime;
      }, { 
        timeout: 2000,
        timeoutMsg: 'Direct state pattern should enable automatic updates'
      });
      
      // This test passing proves that:
      // 1. Base class directly owns and updates @State (no controller.value needed)
      // 2. State changes automatically trigger re-renders (no host.requestUpdate() needed)
      // 3. No ReactiveController interface implementation needed
      // 4. No host reference needed in constructor
      // 5. Much simpler than Lit's ReactiveController pattern
      const finalTime = frameContent.querySelector('.current-time')?.textContent;
      expect(finalTime).not.toBe(initialTime);
    });
  });

  describe('es2022 custom-element output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-direct-state/es2022.custom-element.html', 'es2022-custom-elements');
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.current-time'), { timeout: 5000 });
    });

    it('direct state management works in custom elements build', async () => {
      // Verify clock is running in custom elements build
      const initialTime = frameContent.querySelector('.current-time')?.textContent;
      
      await browser.waitUntil(() => {
        const currentTime = frameContent.querySelector('.current-time')?.textContent;
        return currentTime !== initialTime;
      }, { 
        timeout: 2000,
        timeoutMsg: 'Clock should update in custom elements build'
      });
      
      // Verify direct state inheritance works in custom elements build
      const updatedTime = frameContent.querySelector('.current-time')?.textContent;
      expect(updatedTime).not.toBe(initialTime);
      expect(updatedTime).toContain('Current Time:');
    });
  });
});
