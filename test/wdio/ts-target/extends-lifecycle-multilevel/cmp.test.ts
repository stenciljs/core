import { browser, expect } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';

/**
 * Tests for multi-level lifecycle inheritance. Built with
 * `tsconfig-es2022.json` > `"target": "es2022"` `dist` and `dist-custom-elements` outputs.
 * 
 * Inheritance chain: Component → ParentBase → GrandparentBase
 */

describe('Test Case #2 – Multi-Level Lifecycle Inheritance (Component → Base → GrandparentBase)', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-lifecycle-multilevel/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.lifecycle-info'), { timeout: 5000 });
    });

    it('inherits componentWillLoad through entire inheritance chain', async () => {
      const frameEle = await browser.$('#es2022-dist');
      const lifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      
      // Verify all three levels fire componentWillLoad in correct order
      expect(lifecycleCalls).toContain('GrandparentBase.componentWillLoad');
      expect(lifecycleCalls).toContain('ParentBase.componentWillLoad');
      expect(lifecycleCalls).toContain('Component.componentWillLoad');
      
      // Verify order: Grandparent → Parent → Component
      const willLoadIndices = [
        lifecycleCalls.indexOf('GrandparentBase.componentWillLoad'),
        lifecycleCalls.indexOf('ParentBase.componentWillLoad'),
        lifecycleCalls.indexOf('Component.componentWillLoad')
      ];
      expect(willLoadIndices[0]).toBeLessThan(willLoadIndices[1]);
      expect(willLoadIndices[1]).toBeLessThan(willLoadIndices[2]);
    });

    it('inherits componentDidLoad through entire inheritance chain', async () => {
      const frameEle = await browser.$('#es2022-dist');
      const lifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      
      // Verify all three levels fire componentDidLoad in correct order
      expect(lifecycleCalls).toContain('GrandparentBase.componentDidLoad');
      expect(lifecycleCalls).toContain('ParentBase.componentDidLoad');
      expect(lifecycleCalls).toContain('Component.componentDidLoad');
      
      // Verify order: Grandparent → Parent → Component
      const didLoadIndices = [
        lifecycleCalls.indexOf('GrandparentBase.componentDidLoad'),
        lifecycleCalls.indexOf('ParentBase.componentDidLoad'),
        lifecycleCalls.indexOf('Component.componentDidLoad')
      ];
      expect(didLoadIndices[0]).toBeLessThan(didLoadIndices[1]);
      expect(didLoadIndices[1]).toBeLessThan(didLoadIndices[2]);
    });

    it('inherits componentWillRender through entire inheritance chain', async () => {
      const frameEle = await browser.$('#es2022-dist');
      const lifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      
      // Verify all three levels fire componentWillRender
      expect(lifecycleCalls).toContain('GrandparentBase.componentWillRender');
      expect(lifecycleCalls).toContain('ParentBase.componentWillRender');
      expect(lifecycleCalls).toContain('Component.componentWillRender');
    });

    it('inherits componentDidRender through entire inheritance chain', async () => {
      const frameEle = await browser.$('#es2022-dist');
      const lifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      
      // Verify all three levels fire componentDidRender
      expect(lifecycleCalls).toContain('GrandparentBase.componentDidRender');
      expect(lifecycleCalls).toContain('ParentBase.componentDidRender');
      expect(lifecycleCalls).toContain('Component.componentDidRender');
    });

    it('inherits update lifecycle through entire inheritance chain on state change', async () => {
      const frameEle = await browser.$('#es2022-dist');
      
      // Precondition: Verify update lifecycle events don't exist yet
      const initialLifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      expect(initialLifecycleCalls).not.toContain('GrandparentBase.componentWillUpdate');
      expect(initialLifecycleCalls).not.toContain('ParentBase.componentWillUpdate');
      expect(initialLifecycleCalls).not.toContain('Component.componentWillUpdate');

      // Trigger update
      const button = frameContent.querySelector('.trigger-update') as HTMLButtonElement;
      button?.click();

      // Wait for update and check value changed
      await browser.waitUntil(() => {
        const valueEl = frameContent.querySelector('.current-value');
        return valueEl?.textContent?.includes('updated');
      }, { timeout: 3000 });

      // Verify update lifecycle events were tracked through entire chain
      const updatedLifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      
      // Verify all three levels fire update lifecycle
      expect(updatedLifecycleCalls).toContain('GrandparentBase.componentWillUpdate');
      expect(updatedLifecycleCalls).toContain('ParentBase.componentWillUpdate');
      expect(updatedLifecycleCalls).toContain('Component.componentWillUpdate');
      
      expect(updatedLifecycleCalls).toContain('GrandparentBase.componentDidUpdate');
      expect(updatedLifecycleCalls).toContain('ParentBase.componentDidUpdate');
      expect(updatedLifecycleCalls).toContain('Component.componentDidUpdate');

      // Verify willUpdate order: Grandparent → Parent → Component
      const willUpdateIndices = [
        updatedLifecycleCalls.indexOf('GrandparentBase.componentWillUpdate'),
        updatedLifecycleCalls.indexOf('ParentBase.componentWillUpdate'),
        updatedLifecycleCalls.indexOf('Component.componentWillUpdate')
      ];
      expect(willUpdateIndices[0]).toBeLessThan(willUpdateIndices[1]);
      expect(willUpdateIndices[1]).toBeLessThan(willUpdateIndices[2]);
    });

    it('verifies complete lifecycle event count includes all inheritance levels', async () => {
      const frameEle = await browser.$('#es2022-dist');
      const lifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      
      // Should have at least 12 events (4 lifecycle methods × 3 inheritance levels)
      // willLoad, didLoad, willRender, didRender for each of: GrandparentBase, ParentBase, Component
      expect(lifecycleCalls.length).toBeGreaterThanOrEqual(12);
      
      // Verify we have representation from all inheritance levels
      const grandparentEvents = lifecycleCalls.filter(call => call.startsWith('GrandparentBase.'));
      const parentEvents = lifecycleCalls.filter(call => call.startsWith('ParentBase.'));
      const componentEvents = lifecycleCalls.filter(call => call.startsWith('Component.'));
      
      expect(grandparentEvents.length).toBeGreaterThanOrEqual(4);
      expect(parentEvents.length).toBeGreaterThanOrEqual(4);
      expect(componentEvents.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('es2022 custom-element output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-lifecycle-multilevel/es2022.custom-element.html', 'es2022-custom-elements');
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.lifecycle-info'), { timeout: 5000 });
    });

    it('inherits multi-level lifecycle hooks in custom elements build', async () => {
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      const lifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      
      // Verify all inheritance levels are present in custom elements build
      expect(lifecycleCalls).toContain('GrandparentBase.componentWillLoad');
      expect(lifecycleCalls).toContain('ParentBase.componentWillLoad');
      expect(lifecycleCalls).toContain('Component.componentWillLoad');
      
      expect(lifecycleCalls).toContain('GrandparentBase.componentDidLoad');
      expect(lifecycleCalls).toContain('ParentBase.componentDidLoad');
      expect(lifecycleCalls).toContain('Component.componentDidLoad');
      
      // Verify custom elements build maintains inheritance chain integrity
      expect(lifecycleCalls.length).toBeGreaterThanOrEqual(12);
    });
  });
});
