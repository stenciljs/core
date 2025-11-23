import { browser, expect } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';

/**
 * Test Case #4 – Method Inheritance Basics
 * Tests for @Method decorator inheritance, super() calls, method override, and method composition.
 * Built with `tsconfig-es2022.json` > `"target": "es2022"` `dist` and `dist-custom-elements` outputs.
 */

describe('Test Case #4 – Method Inheritance Basics', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-methods/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.display-value'), { timeout: 5000 });
      
      // Reset state before each test
      const component = frameContent.querySelector<any>('extends-methods');
      await component.reset();
    });

    it('inherits @Method from base class', async () => {
      const component = frameContent.querySelector<any>('extends-methods');
      
      // Call inherited baseMethod
      const result = await component.baseMethod();
      expect(result).toBe('base');
      
      // Verify internal state was updated
      const internalValue = await component.getInternalValue();
      expect(internalValue).toBe('baseMethod called');
      
      // Verify call was logged
      const callLog = await component.getCallLog();
      expect(callLog).toContain('baseMethod');
    });

    it('can call inherited methods that return values', async () => {
      const component = frameContent.querySelector<any>('extends-methods');
      
      const result = await component.baseMethod();
      expect(result).toBe('base');
      expect(typeof result).toBe('string');
    });

    it('overrides method with super() call', async () => {
      const component = frameContent.querySelector<any>('extends-methods');
      
      // Call overridden method
      const result = await component.overridableMethod();
      
      // Verify return value includes both base and child
      expect(result).toBe('base-overridable+child');
      
      // Verify both base and child implementations ran
      const callLog = await component.getCallLog();
      expect(callLog).toContain('overridableMethod:base');
      expect(callLog).toContain('overridableMethod:child');
      
      // Verify execution order (base first, then child)
      const baseIndex = callLog.indexOf('overridableMethod:base');
      const childIndex = callLog.indexOf('overridableMethod:child');
      expect(baseIndex).toBeLessThan(childIndex);
      
      // Verify final internal state is from child
      const internalValue = await component.getInternalValue();
      expect(internalValue).toBe('child override with super');
    });

    it('executes child-specific methods', async () => {
      const component = frameContent.querySelector<any>('extends-methods');
      
      // Call child method
      const result = await component.childMethod();
      expect(result).toBe('child');
      
      // Verify child method updated state
      const internalValue = await component.getInternalValue();
      expect(internalValue).toBe('childMethod called');
      
      // Verify call log
      const callLog = await component.getCallLog();
      expect(callLog).toContain('childMethod');
    });

    it('composes parent and child methods', async () => {
      const component = frameContent.querySelector<any>('extends-methods');
      
      // Call composed method that uses both parent and child
      const result = await component.composedMethod();
      expect(result).toBe('baseMethod called + child composition');
      
      // Verify both parent and child methods were called
      const callLog = await component.getCallLog();
      expect(callLog).toContain('baseMethod');
      expect(callLog).toContain('composedMethod:child');
      
      // Verify execution order
      const baseIndex = callLog.indexOf('baseMethod');
      const childIndex = callLog.indexOf('composedMethod:child');
      expect(baseIndex).toBeLessThan(childIndex);
    });

    it('updates component state from method calls', async () => {
      const component = frameContent.querySelector<any>('extends-methods');
      
      // Initial state
      let displayValue = frameContent.querySelector('.display-value')?.textContent;
      expect(displayValue).toContain('waiting...');
      
      // Call method that updates @State
      await component.childMethod();
      await browser.pause(100);
      
      // Verify state update triggered render
      displayValue = frameContent.querySelector('.display-value')?.textContent;
      expect(displayValue).toContain('Child: childMethod called');
    });

    it('uses protected helper methods from base class', async () => {
      const component = frameContent.querySelector<any>('extends-methods');
      
      // Child method uses protected formatValue from base
      await component.childMethod();
      await browser.pause(100);
      
      const displayValue = frameContent.querySelector('.display-value')?.textContent;
      // formatValue is called with 'Child' prefix
      expect(displayValue).toContain('Child:');
    });

    it('maintains separate method call history', async () => {
      const component = frameContent.querySelector<any>('extends-methods');
      
      // Call multiple methods
      await component.baseMethod();
      await component.childMethod();
      await component.overridableMethod();
      
      // Verify all calls are tracked
      const callLog = await component.getCallLog();
      expect(callLog.length).toBe(4); // baseMethod, childMethod, overridableMethod:base, overridableMethod:child
      expect(callLog[0]).toBe('baseMethod');
      expect(callLog[1]).toBe('childMethod');
      expect(callLog[2]).toBe('overridableMethod:base');
      expect(callLog[3]).toBe('overridableMethod:child');
    });

    it('resets state correctly', async () => {
      const component = frameContent.querySelector<any>('extends-methods');
      
      // Make some calls
      await component.baseMethod();
      await component.childMethod();
      
      let callLog = await component.getCallLog();
      expect(callLog.length).toBeGreaterThan(0);
      
      // Reset
      await component.reset();
      
      // Verify reset
      callLog = await component.getCallLog();
      expect(callLog.length).toBe(0);
      
      const internalValue = await component.getInternalValue();
      expect(internalValue).toBe('initial');
    });
  });

  describe('es2022 custom-element output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      await browser.switchToParentFrame();
      frameContent = await setupIFrameTest('/extends-methods/es2022.custom-element.html', 'es2022-custom-elements');
      const frameEle = await browser.$('iframe#es2022-custom-elements');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('.display-value'), { timeout: 5000 });
      
      // Reset state before each test
      const component = frameContent.querySelector<any>('extends-methods');
      await component.reset();
    });

    it('inherits methods in custom elements build', async () => {
      const component = frameContent.querySelector<any>('extends-methods');
      
      const result = await component.baseMethod();
      expect(result).toBe('base');
      
      const internalValue = await component.getInternalValue();
      expect(internalValue).toBe('baseMethod called');
    });

    it('overrides methods with super() in custom elements build', async () => {
      const component = frameContent.querySelector<any>('extends-methods');
      
      const result = await component.overridableMethod();
      expect(result).toBe('base-overridable+child');
      
      const callLog = await component.getCallLog();
      expect(callLog).toContain('overridableMethod:base');
      expect(callLog).toContain('overridableMethod:child');
    });

    it('executes child methods in custom elements build', async () => {
      const component = frameContent.querySelector<any>('extends-methods');
      
      const result = await component.childMethod();
      expect(result).toBe('child');
      
      await browser.pause(100);
      const displayValue = frameContent.querySelector('.display-value')?.textContent;
      expect(displayValue).toContain('Child: childMethod called');
    });

    it('composes methods in custom elements build', async () => {
      const component = frameContent.querySelector<any>('extends-methods');
      
      const result = await component.composedMethod();
      expect(result).toBe('baseMethod called + child composition');
      
      const callLog = await component.getCallLog();
      expect(callLog).toContain('baseMethod');
      expect(callLog).toContain('composedMethod:child');
    });
  });
});

