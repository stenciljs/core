import { browser, expect } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';

/**
 * Tests for ReactiveControllerHost pattern - composition-based controllers
 * with automatic lifecycle hooking. Built with
 * `tsconfig-es2022.json` > `"target": "es2022"` `dist` and `dist-custom-elements` outputs.
 * 
 * This verifies that:
 * 1. Controllers are automatically called during lifecycle events
 * 2. Controllers can trigger component updates via requestUpdate()
 * 3. Multiple controllers can be composed together
 * 4. No super() calls needed for controller lifecycle methods
 */

describe('Test Case – ReactiveControllerHost Pattern', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-via-host/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('extends-via-host-cmp'), { timeout: 5000 });
    });

    it('component renders with controller functionality', async () => {
      const component = frameContent.querySelector('extends-via-host-cmp');
      expect(component).toBeTruthy();
      
      const heading = component?.querySelector('h3');
      expect(heading?.textContent).toBe('The mouse is at:');
      
      const pre = component?.querySelector('pre');
      expect(pre).toBeTruthy();
    });

    it('mouse controller tracks mouse position and updates component', async () => {
      const component = frameContent.querySelector('extends-via-host-cmp');
      const pre = component?.querySelector('pre');
      
      // Get initial position (should be 0, 0)
      const initialText = pre?.textContent;
      expect(initialText).toContain('x: 0');
      expect(initialText).toContain('y: 0');
      
      // Simulate mouse movement in the iframe
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.execute((el) => {
        const iframe = el as any;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          // Dispatch mousemove event
          const mouseEvent = new MouseEvent('mousemove', {
            clientX: 100,
            clientY: 200,
            bubbles: true,
            cancelable: true
          });
          doc.dispatchEvent(mouseEvent);
        }
      });
      
      // Wait for component to update
      await browser.waitUntil(() => {
        const currentText = component?.querySelector('pre')?.textContent;
        return currentText?.includes('x: 100') && currentText?.includes('y: 200');
      }, { 
        timeout: 2000,
        timeoutMsg: 'Mouse controller should update component position'
      });
      
      const updatedText = pre?.textContent;
      expect(updatedText).toContain('x: 100');
      expect(updatedText).toContain('y: 200');
    });

    it('controller hostConnected is called automatically', async () => {
      const frameEle = await browser.$('#es2022-dist');
      
      // Verify hostConnected was called via test hook (component is already connected in beforeEach)
      const hostConnectedCalled = await frameEle.execute((el) => {
        const iframe = el as any;
        const win = iframe.contentWindow;
        return (win as any).__mouseControllerConnected || false;
      });
      expect(hostConnectedCalled).toBe(true);
    });

    it('controller hostDisconnected is called when component is removed', async () => {
      const component = frameContent.querySelector('extends-via-host-cmp');
      const frameEle = await browser.$('#es2022-dist');
      
      // Clear any previous test state
      await frameEle.execute((el) => {
        const iframe = el as any;
        const win = iframe.contentWindow;
        if (win) {
          (win as any).__mouseControllerDisconnected = false;
        }
      });
      
      // Verify hostDisconnected has not been called yet
      const initialState = await frameEle.execute((el) => {
        const iframe = el as any;
        const win = iframe.contentWindow;
        return (win as any).__mouseControllerDisconnected || false;
      });
      expect(initialState).toBe(false);
      
      // Remove component from DOM
      component?.remove();
      
      // Wait for disconnectedCallback to be called
      await browser.pause(200);
      
      // Verify component was removed
      const removedComponent = frameContent.querySelector('extends-via-host-cmp');
      expect(removedComponent).toBeFalsy();
      
      // Verify hostDisconnected was called via test hook
      const hostDisconnectedCalled = await frameEle.execute((el) => {
        const iframe = el as any;
        const win = iframe.contentWindow;
        return (win as any).__mouseControllerDisconnected || false;
      });
      expect(hostDisconnectedCalled).toBe(true);
    });

  });

  describe('es2022 dist-custom-elements output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-via-host/es2022.custom-element.html', 'es2022-custom-elements');
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('extends-via-host-cmp'), { timeout: 5000 });
    });

    it('mouse controller updates work in custom elements build', async () => {
      const component = frameContent.querySelector('extends-via-host-cmp');
      const pre = component?.querySelector('pre');
      
      // Move mouse
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      await frameEle.execute((el) => {
        const iframe = el as any;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          const mouseEvent = new MouseEvent('mousemove', {
            clientX: 150,
            clientY: 250,
            bubbles: true
          });
          doc.dispatchEvent(mouseEvent);
        }
      });
      
      // Wait for update
      await browser.waitUntil(() => {
        const currentText = component?.querySelector('pre')?.textContent;
        return currentText?.includes('x: 150') && currentText?.includes('y: 250');
      }, { 
        timeout: 2000,
        timeoutMsg: 'Mouse controller should work in custom elements build'
      });
    });
  });
});

