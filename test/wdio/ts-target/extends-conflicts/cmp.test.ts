import { browser, expect } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';

/**
 * Tests for decorator conflicts - duplicate decorator names of the same type in inheritance chains.
 * Built with `tsconfig-es2022.json` > `"target": "es2022"` `dist` and `dist-custom-elements` outputs.
 * 
 * Test Case #13 - Decorator Conflicts
 * Features:
 * - Duplicate @Prop names (component overrides base)
 * - Duplicate @State names (component overrides base)
 * - Duplicate @Method names (component overrides base)
 * - Compiler precedence rules (component decorators take precedence)
 */

describe('Test Case #13 – Decorator Conflicts (Duplicate decorator names)', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-conflicts/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.container'), { timeout: 5000 });
    });

    describe('Duplicate @Prop Names', () => {
      it('component @Prop overrides base @Prop - component value is used', async () => {
        const duplicateProp = frameContent.querySelector('.duplicate-prop-value');
        
        expect(duplicateProp?.textContent).toContain('Duplicate Prop: component prop value');
        expect(duplicateProp?.textContent).not.toContain('base prop value');
      });

      it('component @Prop can be set via attribute', async () => {
        const component = frameContent.querySelector('extends-conflicts');
        component?.setAttribute('duplicate-prop', 'updated via attribute');
        
        await browser.waitUntil(() => {
          const duplicateProp = frameContent.querySelector('.duplicate-prop-value');
          return duplicateProp?.textContent?.includes('updated via attribute');
        }, { timeout: 3000 });

        const duplicateProp = frameContent.querySelector('.duplicate-prop-value');
        expect(duplicateProp?.textContent).toContain('Duplicate Prop: updated via attribute');
      });

      it('component @Prop can be set via property', async () => {
        const component = frameContent.querySelector('extends-conflicts') as any;
        component.duplicateProp = 'updated via property';
        
        await browser.waitUntil(() => {
          const duplicateProp = frameContent.querySelector('.duplicate-prop-value');
          return duplicateProp?.textContent?.includes('updated via property');
        }, { timeout: 3000 });

        const duplicateProp = frameContent.querySelector('.duplicate-prop-value');
        expect(duplicateProp?.textContent).toContain('Duplicate Prop: updated via property');
      });

      it('base-only prop is still accessible and not overridden', async () => {
        const baseOnlyProp = frameContent.querySelector('.base-only-prop-value');
        
        expect(baseOnlyProp?.textContent).toContain('Base Only Prop: base only prop value');
      });
    });

    describe('Duplicate @State Names', () => {
      it('component @State overrides base @State - component value is used', async () => {
        const duplicateState = frameContent.querySelector('.duplicate-state-value');
        
        expect(duplicateState?.textContent).toContain('Duplicate State: component state value');
        expect(duplicateState?.textContent).not.toContain('base state value');
      });

      it('component @State updates trigger re-renders correctly', async () => {
        const component = frameContent.querySelector('extends-conflicts') as any;
        const button = frameContent.querySelector('.update-duplicate-state') as HTMLButtonElement;
        
        // Click button to update duplicate state
        button?.click();
        
        await browser.waitUntil(() => {
          const duplicateState = frameContent.querySelector('.duplicate-state-value');
          return duplicateState?.textContent?.includes('duplicate state updated');
        }, { timeout: 3000 });

        const duplicateState = frameContent.querySelector('.duplicate-state-value');
        expect(duplicateState?.textContent).toContain('Duplicate State: duplicate state updated');
      });

      it('component @State can be updated via method', async () => {
        const component = frameContent.querySelector('extends-conflicts') as any;
        await component.updateDuplicateState('updated via method');
        
        await browser.waitUntil(() => {
          const duplicateState = frameContent.querySelector('.duplicate-state-value');
          return duplicateState?.textContent?.includes('updated via method');
        }, { timeout: 3000 });

        const duplicateState = frameContent.querySelector('.duplicate-state-value');
        expect(duplicateState?.textContent).toContain('Duplicate State: updated via method');
      });

      it('base-only state is still accessible and not overridden', async () => {
        const baseOnlyState = frameContent.querySelector('.base-only-state-value');
        
        expect(baseOnlyState?.textContent).toContain('Base Only State: base only state value');
      });
    });

    describe('Duplicate @Method Names', () => {
      it('component @Method overrides base @Method - component implementation is called', async () => {
        const component = frameContent.querySelector('extends-conflicts') as any;
        
        // Reset call logs
        await component.resetAllCallLogs();
        
        // Call duplicate method - should call component version, not base
        const result = await component.duplicateMethod();
        
        expect(result).toBe('component method');
        expect(result).not.toBe('base method');
      });

      it('component @Method return value is used (not base)', async () => {
        const component = frameContent.querySelector('extends-conflicts') as any;
        
        await component.resetAllCallLogs();
        
        const result = await component.duplicateMethod();
        expect(result).toBe('component method');
      });

      it('component method call log shows component version was called', async () => {
        const component = frameContent.querySelector('extends-conflicts') as any;
        
        await component.resetAllCallLogs();
        
        await component.duplicateMethod();
        
        const componentLog = await component.getComponentMethodCallLog();
        expect(componentLog).toContain('duplicateMethod:component');
        
        // Verify base method was NOT called
        const baseLog = await component.getMethodCallLog();
        expect(baseLog).not.toContain('duplicateMethod:base');
      });

      it('base-only method is still accessible and not overridden', async () => {
        const component = frameContent.querySelector('extends-conflicts') as any;
        
        await component.resetAllCallLogs();
        
        const result = await component.baseOnlyMethod();
        expect(result).toBe('base only method');
        
        const baseLog = await component.getMethodCallLog();
        expect(baseLog).toContain('baseOnlyMethod');
      });
    });

    describe('Compiler Precedence Rules', () => {
      it('component decorators take precedence over base decorators', async () => {
        const duplicateProp = frameContent.querySelector('.duplicate-prop-value');
        const duplicateState = frameContent.querySelector('.duplicate-state-value');
        const component = frameContent.querySelector('extends-conflicts') as any;
        
        // Verify component values are used (not base)
        expect(duplicateProp?.textContent).toContain('component prop value');
        expect(duplicateState?.textContent).toContain('component state value');
        
        // Verify component method is called
        await component.resetAllCallLogs();
        const methodResult = await component.duplicateMethod();
        expect(methodResult).toBe('component method');
      });

      it('non-duplicate base decorators remain accessible', async () => {
        const baseOnlyProp = frameContent.querySelector('.base-only-prop-value');
        const baseOnlyState = frameContent.querySelector('.base-only-state-value');
        const component = frameContent.querySelector('extends-conflicts') as any;
        
        expect(baseOnlyProp?.textContent).toContain('base only prop value');
        expect(baseOnlyState?.textContent).toContain('base only state value');
        
        const methodResult = await component.baseOnlyMethod();
        expect(methodResult).toBe('base only method');
      });

      it('component-only decorators work correctly', async () => {
        const componentOnlyState = frameContent.querySelector('.component-only-state-value');
        const component = frameContent.querySelector('extends-conflicts') as any;
        
        expect(componentOnlyState?.textContent).toContain('component only state');
        
        await component.updateComponentOnlyState('component only updated');
        
        await browser.waitUntil(() => {
          const updatedState = frameContent.querySelector('.component-only-state-value');
          return updatedState?.textContent?.includes('component only updated');
        }, { timeout: 3000 });

        const updatedState = frameContent.querySelector('.component-only-state-value');
        expect(updatedState?.textContent).toContain('Component Only State: component only updated');
      });
    });
  });

  describe('es2022 custom-element output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      await browser.switchToParentFrame();
      frameContent = await setupIFrameTest('/extends-conflicts/es2022.custom-element.html', 'es2022-custom-elements');
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.container'), { timeout: 5000 });
    });

    it('component @Prop overrides base @Prop in custom elements build', async () => {
      const duplicateProp = frameContent.querySelector('.duplicate-prop-value');
      
      expect(duplicateProp?.textContent).toContain('Duplicate Prop: component prop value');
      expect(duplicateProp?.textContent).not.toContain('base prop value');
    });

    it('component @State overrides base @State in custom elements build', async () => {
      const duplicateState = frameContent.querySelector('.duplicate-state-value');
      
      expect(duplicateState?.textContent).toContain('Duplicate State: component state value');
      expect(duplicateState?.textContent).not.toContain('base state value');
    });

    it('component @Method overrides base @Method in custom elements build', async () => {
      const component = frameContent.querySelector('extends-conflicts') as any;
      
      await component.resetAllCallLogs();
      
      const result = await component.duplicateMethod();
      expect(result).toBe('component method');
      
      const componentLog = await component.getComponentMethodCallLog();
      expect(componentLog).toContain('duplicateMethod:component');
    });

    it('component decorators take precedence in custom elements build', async () => {
      const duplicateProp = frameContent.querySelector('.duplicate-prop-value');
      const duplicateState = frameContent.querySelector('.duplicate-state-value');
      const component = frameContent.querySelector('extends-conflicts') as any;
      
      expect(duplicateProp?.textContent).toContain('component prop value');
      expect(duplicateState?.textContent).toContain('component state value');
      
      await component.resetAllCallLogs();
      const methodResult = await component.duplicateMethod();
      expect(methodResult).toBe('component method');
    });
  });
});

