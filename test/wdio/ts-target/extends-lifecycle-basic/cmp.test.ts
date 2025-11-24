import { browser, expect } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';

/**
 * Tests for extending Stencil-decorated classes with lifecycle hooks.
 * Built with `tsconfig-es2022.json` > `"target": "es2022"` `dist` and `dist-custom-elements` outputs.
 */

describe('Test Case #1 – Lifecycle inheritance (Load, Render, Update)', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-lifecycle-basic/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.lifecycle-info'), { timeout: 5000 });
    });

    it('inherits componentWillLoad from LifecycleBase', async () => {
      const frameEle = await browser.$('#es2022-dist');
      const lifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      expect(lifecycleCalls).toContain('componentWillLoad');
    });

    it('inherits componentDidLoad from LifecycleBase', async () => {
      const frameEle = await browser.$('#es2022-dist');
      const lifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      expect(lifecycleCalls).toContain('componentDidLoad');
    });

    it('inherits componentWillRender from LifecycleBase', async () => {
      const frameEle = await browser.$('#es2022-dist');
      const lifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      expect(lifecycleCalls).toContain('componentWillRender');
    });

    it('inherits componentDidRender from LifecycleBase', async () => {
      const frameEle = await browser.$('#es2022-dist');
      const lifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      expect(lifecycleCalls).toContain('componentDidRender');
    });

    it('inherits update lifecycle on state change', async () => {
      // Precondition: Verify update lifecycle events don't exist yet
      const frameEle = await browser.$('#es2022-dist');
      const initialLifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      expect(initialLifecycleCalls).not.toContain('componentWillUpdate');
      expect(initialLifecycleCalls).not.toContain('componentDidUpdate');

      // Trigger update
      const button = frameContent.querySelector('.trigger-update') as HTMLButtonElement;
      button?.click();

      // Wait for update and check value changed
      await browser.waitUntil(() => {
        const valueEl = frameContent.querySelector('.current-value');
        return valueEl?.textContent?.includes('updated');
      }, { timeout: 3000 });

      // Verify update lifecycle events were tracked to global array in iframe
      const updatedLifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      expect(updatedLifecycleCalls).toContain('componentWillUpdate');
      expect(updatedLifecycleCalls).toContain('componentDidUpdate');
    });
  });

  describe('es2022 custom-element output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-lifecycle-basic/es2022.custom-element.html', 'es2022-custom-elements');
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.lifecycle-info'), { timeout: 5000 });
    });

    it('inherits lifecycle hooks in custom elements build', async () => {
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      const lifecycleCalls = await frameEle.execute((el) => (el.contentWindow as any).lifecycleCalls || []);
      
      // Verify all core lifecycle events are present
      expect(lifecycleCalls).toContain('componentWillLoad');
      expect(lifecycleCalls).toContain('componentDidLoad');
      expect(lifecycleCalls).toContain('componentWillRender');
      expect(lifecycleCalls).toContain('componentDidRender');
    });
  });
});