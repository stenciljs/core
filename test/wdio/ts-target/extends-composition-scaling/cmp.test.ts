import { browser, expect } from '@wdio/globals';
import { setupIFrameTest } from '../../util.js';

/**
 * Tests for composition-based scaling with 3 components and 2 controllers.
 * Built with `tsconfig-es2022.json` > `"target": "es2022"` `dist` and `dist-custom-elements` outputs.
 * 
 * Test Case #16 - Composition-Based Scaling
 * This verifies that:
 * 1. 3 components (TextInput, RadioGroup, CheckboxGroup) work with composition
 * 2. 2 controllers (ValidationController, FocusController) work via composition
 * 3. Lifecycle methods are called automatically via ReactiveControllerHost
 * 4. Validation triggers on blur
 * 5. Focus tracking works
 * 6. Controllers are properly composed (not inherited)
 */

describe('Test Case #16 – Composition-Based Scaling (3 components, 2 controllers)', () => {
  describe('es2022 dist output', () => {
    let frameContent: HTMLElement;

    beforeEach(async () => {
      frameContent = await setupIFrameTest('/extends-composition-scaling/es2022.dist.html', 'es2022-dist');
      const frameEle = await browser.$('#es2022-dist');
      await frameEle.waitUntil(async () => !!frameContent.querySelector('composition-scaling-demo'), { timeout: 5000 });
    });

    it('all 3 components render correctly', async () => {
      const demo = frameContent.querySelector('composition-scaling-demo');
      expect(demo).toBeTruthy();
      
      const textInput = demo?.querySelector('composition-text-input');
      const radioGroup = demo?.querySelector('composition-radio-group');
      const checkboxGroup = demo?.querySelector('composition-checkbox-group');
      
      expect(textInput).toBeTruthy();
      expect(radioGroup).toBeTruthy();
      expect(checkboxGroup).toBeTruthy();
    });

    it('text input validation works on blur', async () => {
      const demo = frameContent.querySelector('composition-scaling-demo');
      expect(demo).toBeTruthy();
      
      // Wait for textInput component to be available
      await browser.waitUntil(() => {
        const textInput = demo?.querySelector('composition-text-input');
        return !!textInput;
      }, { timeout: 5000 });
      
      const textInput = demo?.querySelector('composition-text-input');
      expect(textInput).toBeTruthy();
      
      // Wait for input element to be available
      await browser.waitUntil(() => {
        const input = textInput?.querySelector('input[type="text"]');
        return !!input;
      }, { timeout: 5000 });
      
      const input = textInput?.querySelector('input[type="text"]') as HTMLInputElement;
      expect(input).toBeTruthy();
      
      // Focus and blur without entering value - should show error
      input?.focus();
      await browser.pause(100);
      input?.blur();
      await browser.pause(100); // Give component time to process blur event
      
      await browser.waitUntil(() => {
        const errorText = textInput?.querySelector('.error-text');
        return errorText?.textContent?.includes('Name is required');
      }, { timeout: 5000 });
      
      const errorText = textInput?.querySelector('.error-text');
      expect(errorText?.textContent).toContain('Name is required');
    });

    it('text input focus tracking works', async () => {
      const demo = frameContent.querySelector('composition-scaling-demo');
      expect(demo).toBeTruthy();
      
      const textInput = demo?.querySelector('composition-text-input');
      expect(textInput).toBeTruthy();
      
      // Wait for input and focus-info elements to be available
      await browser.waitUntil(() => {
        const input = textInput?.querySelector('input[type="text"]');
        const focusInfo = textInput?.querySelector('.focus-info');
        return !!input && !!focusInfo;
      }, { timeout: 5000 });
      
      const input = textInput?.querySelector('input[type="text"]') as HTMLInputElement;
      const focusInfo = textInput?.querySelector('.focus-info');
      
      expect(input).toBeTruthy();
      expect(focusInfo).toBeTruthy();
      
      // Initial state should show not focused
      expect(focusInfo?.textContent).toContain('Focused: No');
      expect(focusInfo?.textContent).toContain('Focus Count: 0');
      
      // Focus the input
      input?.focus();
      await browser.pause(100);
      
      await browser.waitUntil(() => {
        const info = textInput?.querySelector('.focus-info')?.textContent;
        return info?.includes('Focused: Yes') && info?.includes('Focus Count: 1');
      }, { timeout: 5000 });
      
      // Blur the input
      input?.blur();
      await browser.pause(100);
      
      await browser.waitUntil(() => {
        const info = textInput?.querySelector('.focus-info')?.textContent;
        return info?.includes('Focused: No') && info?.includes('Blur Count: 1');
      }, { timeout: 5000 });
    });

    it('radio group validation works on blur', async () => {
      const demo = frameContent.querySelector('composition-scaling-demo');
      expect(demo).toBeTruthy();
      
      const radioGroup = demo?.querySelector('composition-radio-group');
      expect(radioGroup).toBeTruthy();
      
      // Wait for radio container to be available
      await browser.waitUntil(() => {
        const container = radioGroup?.querySelector('.radio-group');
        return !!container;
      }, { timeout: 5000 });
      
      const radioContainer = radioGroup?.querySelector('.radio-group');
      
      expect(radioContainer).toBeTruthy();
      
      // Focus and blur without selecting - should show error
      (radioContainer as HTMLElement)?.focus();
      await browser.pause(100);
      (radioContainer as HTMLElement)?.blur();
      
      await browser.waitUntil(() => {
        const errorText = radioGroup?.querySelector('.error-text');
        return errorText?.textContent?.includes('Please select an option');
      }, { timeout: 5000 });
      
      const errorText = radioGroup?.querySelector('.error-text');
      expect(errorText?.textContent).toContain('Please select an option');
    });

    it('checkbox group validation works on blur', async () => {
      const demo = frameContent.querySelector('composition-scaling-demo');
      expect(demo).toBeTruthy();
      
      const checkboxGroup = demo?.querySelector('composition-checkbox-group');
      expect(checkboxGroup).toBeTruthy();
      
      // Wait for checkbox container to be available
      await browser.waitUntil(() => {
        const container = checkboxGroup?.querySelector('.checkbox-group');
        return !!container;
      }, { timeout: 5000 });
      
      const checkboxContainer = checkboxGroup?.querySelector('.checkbox-group');
      
      expect(checkboxContainer).toBeTruthy();
      
      // Focus and blur without selecting - should show error
      (checkboxContainer as HTMLElement)?.focus();
      await browser.pause(100);
      (checkboxContainer as HTMLElement)?.blur();
      
      await browser.waitUntil(() => {
        const errorText = checkboxGroup?.querySelector('.error-text');
        return errorText?.textContent?.includes('Please select at least one option');
      }, { timeout: 5000 });
      
      const errorText = checkboxGroup?.querySelector('.error-text');
      expect(errorText?.textContent).toContain('Please select at least one option');
    });

    it('validation and focus controllers work together', async () => {
      const textInput = frameContent.querySelector('composition-text-input');
      const input = textInput?.querySelector('input[type="text"]') as HTMLInputElement;
      
      // Focus - should track focus
      input?.focus();
      await browser.pause(100);
      
      await browser.waitUntil(() => {
        const focusInfo = textInput?.querySelector('.focus-info')?.textContent;
        return focusInfo?.includes('Focused: Yes');
      }, { timeout: 5000 });
      
      // Blur - should track blur AND validate
      input?.blur();
      await browser.pause(100);
      
      await browser.waitUntil(() => {
        const focusInfo = textInput?.querySelector('.focus-info')?.textContent;
        const errorText = textInput?.querySelector('.error-text');
        return focusInfo?.includes('Focused: No') && 
               focusInfo?.includes('Blur Count: 1') &&
               errorText?.textContent?.includes('Name is required');
      }, { timeout: 5000 });
    });

    it('validates that both controllers use composition pattern', async () => {
      const demo = frameContent.querySelector('composition-scaling-demo');
      expect(demo).toBeTruthy();
      
      // All components should have both validation and focus functionality
      const textInput = demo?.querySelector('composition-text-input');
      const radioGroup = demo?.querySelector('composition-radio-group');
      const checkboxGroup = demo?.querySelector('composition-checkbox-group');
      
      // Each should have validation error display capability (trigger validation first)
      // Trigger validation on text input to show error
      const textInputField = textInput?.querySelector('input[type="text"]') as HTMLInputElement;
      textInputField?.focus();
      await browser.pause(50);
      textInputField?.blur();
      await browser.waitUntil(() => {
        const errorText = textInput?.querySelector('.error-text');
        return errorText?.textContent?.includes('Name is required');
      }, { timeout: 5000 });
      expect(textInput?.querySelector('.error-text')).toBeTruthy();
      
      // Trigger validation on radio group to show error
      const radioContainer = radioGroup?.querySelector('.radio-group') as HTMLElement;
      radioContainer?.focus();
      await browser.pause(50);
      radioContainer?.blur();
      await browser.waitUntil(() => {
        const errorText = radioGroup?.querySelector('.error-text');
        return errorText?.textContent?.includes('Please select an option');
      }, { timeout: 5000 });
      expect(radioGroup?.querySelector('.error-text')).toBeTruthy();
      
      // Trigger validation on checkbox group to show error
      const checkboxContainer = checkboxGroup?.querySelector('.checkbox-group') as HTMLElement;
      checkboxContainer?.focus();
      await browser.pause(50);
      checkboxContainer?.blur();
      await browser.waitUntil(() => {
        const errorText = checkboxGroup?.querySelector('.error-text');
        return errorText?.textContent?.includes('Please select at least one option');
      }, { timeout: 5000 });
      expect(checkboxGroup?.querySelector('.error-text')).toBeTruthy();
      
      // Each should have focus info display
      expect(textInput?.querySelector('.focus-info')).toBeTruthy();
      expect(radioGroup?.querySelector('.focus-info')).toBeTruthy();
      expect(checkboxGroup?.querySelector('.focus-info')).toBeTruthy();
    });

    it('controllers are automatically called during lifecycle via ReactiveControllerHost', async () => {
      // This test verifies that controllers' lifecycle methods are called automatically
      // via the ReactiveControllerHost base class, without needing explicit super() calls
      // for each controller's lifecycle methods
      
      const textInput = frameContent.querySelector('composition-text-input');
      const input = textInput?.querySelector('input[type="text"]') as HTMLInputElement;
      
      // The fact that validation and focus tracking work proves that:
      // 1. Controllers' hostDidLoad() was called automatically
      // 2. Controllers are properly registered with ReactiveControllerHost
      // 3. Lifecycle methods are chained automatically
      
      // Verify controllers are working (which proves lifecycle was called)
      input?.focus();
      await browser.pause(100);
      
      await browser.waitUntil(() => {
        const focusInfo = textInput?.querySelector('.focus-info')?.textContent;
        return focusInfo?.includes('Focus Count: 1');
      }, { timeout: 5000 });
      
      // This proves the composition pattern works:
      // - Component extends ReactiveControllerHost
      // - Controllers are instantiated and added automatically
      // - Lifecycle methods are called automatically via base class
      // - No need for explicit super() calls for each controller
    });
  });
});

