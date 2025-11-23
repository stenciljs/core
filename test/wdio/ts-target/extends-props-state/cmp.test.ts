import { browser, expect } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';

/**
 * Test Case #3: Property & State Inheritance Basics
 * 
 * Tests for @Prop and @State inheritance from base classes.
 * Built with `tsconfig-es2022.json` > `"target": "es2022"` `dist` and `dist-custom-elements` outputs.
 */

describe('Test Case #3 – Property & State Inheritance Basics', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-props-state/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.container'), { timeout: 5000 });
    });

    it('renders default inherited @Prop values from base class', async () => {
      const baseProp = frameContent.querySelector('.base-prop');
      const baseCount = frameContent.querySelector('.base-count');
      
      expect(baseProp?.textContent).toContain('Base Prop: base prop value');
      expect(baseCount?.textContent).toContain('Base Count: 0');
    });

    it('renders default inherited @State values from base class', async () => {
      const baseState = frameContent.querySelector('.base-state');
      const baseEnabled = frameContent.querySelector('.base-enabled');
      
      expect(baseState?.textContent).toContain('Base State: base state value');
      expect(baseEnabled?.textContent).toContain('Base Enabled: true');
    });

    it('renders component-specific @Prop values without conflicts', async () => {
      const componentProp = frameContent.querySelector('.component-prop');
      
      expect(componentProp?.textContent).toContain('Component Prop: component prop value');
    });

    it('renders component-specific @State values without conflicts', async () => {
      const componentState = frameContent.querySelector('.component-state-value');
      
      expect(componentState?.textContent).toContain('Component State: component state value');
    });

    it('updates inherited @Prop via attribute', async () => {
      const component = frameContent.querySelector('extends-props-state');
      component?.setAttribute('base-prop', 'updated via attribute');
      
      await browser.waitUntil(() => {
        const baseProp = frameContent.querySelector('.base-prop');
        return baseProp?.textContent?.includes('updated via attribute');
      }, { timeout: 3000 });

      const baseProp = frameContent.querySelector('.base-prop');
      expect(baseProp?.textContent).toContain('Base Prop: updated via attribute');
    });

    it('updates inherited @Prop via property', async () => {
      const component = frameContent.querySelector('extends-props-state') as any;
      component.baseProp = 'updated via property';
      
      await browser.waitUntil(() => {
        const baseProp = frameContent.querySelector('.base-prop');
        return baseProp?.textContent?.includes('updated via property');
      }, { timeout: 3000 });

      const baseProp = frameContent.querySelector('.base-prop');
      expect(baseProp?.textContent).toContain('Base Prop: updated via property');
    });

    it('updates inherited number @Prop and triggers re-render', async () => {
      const component = frameContent.querySelector('extends-props-state') as any;
      
      // Update via attribute
      component.setAttribute('base-count', '5');
      
      await browser.waitUntil(() => {
        const baseCount = frameContent.querySelector('.base-count');
        return baseCount?.textContent?.includes('5');
      }, { timeout: 3000 });

      const baseCount = frameContent.querySelector('.base-count');
      expect(baseCount?.textContent).toContain('Base Count: 5');
    });

    it('updates component @Prop via attribute', async () => {
      const component = frameContent.querySelector('extends-props-state');
      component?.setAttribute('component-prop', 'updated component prop');
      
      await browser.waitUntil(() => {
        const componentProp = frameContent.querySelector('.component-prop');
        return componentProp?.textContent?.includes('updated component prop');
      }, { timeout: 3000 });

      const componentProp = frameContent.querySelector('.component-prop');
      expect(componentProp?.textContent).toContain('Component Prop: updated component prop');
    });

    it('updates inherited @State and triggers re-render', async () => {
      const component = frameContent.querySelector('extends-props-state') as any;
      const button = frameContent.querySelector('.update-base-state') as HTMLButtonElement;
      
      // Click button to update base state via method
      button?.click();
      
      await browser.waitUntil(() => {
        const baseState = frameContent.querySelector('.base-state');
        return baseState?.textContent?.includes('base state updated');
      }, { timeout: 3000 });

      const baseState = frameContent.querySelector('.base-state');
      expect(baseState?.textContent).toContain('Base State: base state updated');
    });

    it('updates component @State and triggers re-render', async () => {
      const button = frameContent.querySelector('.update-component-state') as HTMLButtonElement;
      
      // Click button to update component state via method
      button?.click();
      
      await browser.waitUntil(() => {
        const componentState = frameContent.querySelector('.component-state-value');
        return componentState?.textContent?.includes('component state updated');
      }, { timeout: 3000 });

      const componentState = frameContent.querySelector('.component-state-value');
      expect(componentState?.textContent).toContain('Component State: component state updated');
    });

    it('toggles inherited boolean @State and re-renders', async () => {
      const button = frameContent.querySelector('.toggle-base-enabled') as HTMLButtonElement;
      
      // Initial state should be true
      let baseEnabled = frameContent.querySelector('.base-enabled');
      expect(baseEnabled?.textContent).toContain('Base Enabled: true');
      
      // Toggle to false
      button?.click();
      
      await browser.waitUntil(() => {
        const baseEnabled = frameContent.querySelector('.base-enabled');
        return baseEnabled?.textContent?.includes('false');
      }, { timeout: 3000 });

      baseEnabled = frameContent.querySelector('.base-enabled');
      expect(baseEnabled?.textContent).toContain('Base Enabled: false');
      
      // Toggle back to true
      button?.click();
      
      await browser.waitUntil(() => {
        const baseEnabled = frameContent.querySelector('.base-enabled');
        return baseEnabled?.textContent?.includes('true');
      }, { timeout: 3000 });

      baseEnabled = frameContent.querySelector('.base-enabled');
      expect(baseEnabled?.textContent).toContain('Base Enabled: true');
    });

    it('increments inherited number @Prop via method and re-renders', async () => {
      const button = frameContent.querySelector('.increment-base-count') as HTMLButtonElement;
      
      // Initial value should be 0
      let baseCount = frameContent.querySelector('.base-count');
      expect(baseCount?.textContent).toContain('Base Count: 0');
      
      // Increment to 1
      button?.click();
      
      await browser.waitUntil(() => {
        const baseCount = frameContent.querySelector('.base-count');
        return baseCount?.textContent?.includes('1');
      }, { timeout: 3000 });

      baseCount = frameContent.querySelector('.base-count');
      expect(baseCount?.textContent).toContain('Base Count: 1');
      
      // Increment to 2
      button?.click();
      
      await browser.waitUntil(() => {
        const baseCount = frameContent.querySelector('.base-count');
        return baseCount?.textContent?.includes('2');
      }, { timeout: 3000 });

      baseCount = frameContent.querySelector('.base-count');
      expect(baseCount?.textContent).toContain('Base Count: 2');
    });
  });

  describe('es2022 custom-element output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      await browser.switchToParentFrame();
      frameContent = await setupIFrameTest('/extends-props-state/es2022.custom-element.html', 'es2022-custom-elements');
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.container'), { timeout: 5000 });
    });

    it('renders inherited props and state in custom elements build', async () => {
      const baseProp = frameContent.querySelector('.base-prop');
      const baseState = frameContent.querySelector('.base-state');
      const componentProp = frameContent.querySelector('.component-prop');
      const componentState = frameContent.querySelector('.component-state-value');
      
      expect(baseProp?.textContent).toContain('Base Prop: base prop value');
      expect(baseState?.textContent).toContain('Base State: base state value');
      expect(componentProp?.textContent).toContain('Component Prop: component prop value');
      expect(componentState?.textContent).toContain('Component State: component state value');
    });

    it('updates inherited @Prop via attribute in custom elements build', async () => {
      const component = frameContent.querySelector('extends-props-state');
      component?.setAttribute('base-prop', 'custom element updated');
      
      await browser.waitUntil(() => {
        const baseProp = frameContent.querySelector('.base-prop');
        return baseProp?.textContent?.includes('custom element updated');
      }, { timeout: 3000 });

      const baseProp = frameContent.querySelector('.base-prop');
      expect(baseProp?.textContent).toContain('Base Prop: custom element updated');
    });

    it('updates inherited @State via method in custom elements build', async () => {
      const button = frameContent.querySelector('.update-base-state') as HTMLButtonElement;
      button?.click();
      
      await browser.waitUntil(() => {
        const baseState = frameContent.querySelector('.base-state');
        return baseState?.textContent?.includes('base state updated');
      }, { timeout: 3000 });

      const baseState = frameContent.querySelector('.base-state');
      expect(baseState?.textContent).toContain('Base State: base state updated');
    });
  });
});

