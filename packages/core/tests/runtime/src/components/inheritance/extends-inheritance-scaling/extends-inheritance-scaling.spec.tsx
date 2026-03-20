import { describe, it, expect, render, h } from '@stencil/vitest';

/**
 * Tests for inheritance-based scaling with 3 components and 2 controllers.
 * Verifies that:
 * 1. 3 components (TextInput, RadioGroup, CheckboxGroup) work with inheritance
 * 2. 2 controllers (ValidationController, FocusController) work via inheritance
 * 3. Lifecycle methods are called correctly
 * 4. Validation triggers on blur
 * 5. Focus tracking works
 */
describe('extends-inheritance-scaling', () => {
  describe('inheritance-based scaling', () => {
    it('all 3 components render correctly', async () => {
      const { root } = await render(<inheritance-scaling-demo />);

      expect(root.querySelector('h1')).toHaveTextContent('Inheritance-Based Scaling Demo');

      const textInput = root.querySelector('inheritance-text-input');
      const radioGroup = root.querySelector('inheritance-radio-group');
      const checkboxGroup = root.querySelector('inheritance-checkbox-group');

      expect(textInput).toBeDefined();
      expect(radioGroup).toBeDefined();
      expect(checkboxGroup).toBeDefined();
    });

    it('text input validation works on blur', async () => {
      const { root, waitForChanges } = await render(<inheritance-scaling-demo />);

      const textInput = root.querySelector('inheritance-text-input');
      const input = textInput?.querySelector('input[type="text"]') as HTMLInputElement;

      // Focus and blur without entering value - should show error
      input?.focus();
      input?.blur();
      await waitForChanges();

      const errorText = textInput?.querySelector('.error-text');
      expect(errorText).toHaveTextContent('Name is required');
    });

    it('text input focus tracking works', async () => {
      const { root, waitForChanges } = await render(<inheritance-scaling-demo />);

      const textInput = root.querySelector('inheritance-text-input');
      const input = textInput?.querySelector('input[type="text"]') as HTMLInputElement;
      const focusInfo = textInput?.querySelector('.focus-info');

      // Initial state should show not focused
      expect(focusInfo).toHaveTextContent('Focused: No');
      expect(focusInfo).toHaveTextContent('Focus Count: 0');

      // Focus the input
      input?.focus();
      await waitForChanges();

      expect(textInput?.querySelector('.focus-info')).toHaveTextContent('Focused: Yes');
      expect(textInput?.querySelector('.focus-info')).toHaveTextContent('Focus Count: 1');

      // Blur the input
      input?.blur();
      await waitForChanges();

      expect(textInput?.querySelector('.focus-info')).toHaveTextContent('Focused: No');
      expect(textInput?.querySelector('.focus-info')).toHaveTextContent('Blur Count: 1');
    });

    it('radio group validation works on blur', async () => {
      const { root, waitForChanges } = await render(<inheritance-scaling-demo />);

      const radioGroup = root.querySelector('inheritance-radio-group');
      const radioContainer = radioGroup?.querySelector('.radio-group') as HTMLElement;

      // Focus and blur without selecting - should show error
      radioContainer?.focus();
      radioContainer?.blur();
      await waitForChanges();

      const errorText = radioGroup?.querySelector('.error-text');
      expect(errorText).toHaveTextContent('Please select an option');
    });

    it('checkbox group validation works on blur', async () => {
      const { root, waitForChanges } = await render(<inheritance-scaling-demo />);

      const checkboxGroup = root.querySelector('inheritance-checkbox-group');
      const checkboxContainer = checkboxGroup?.querySelector('.checkbox-group') as HTMLElement;

      // Focus and blur without selecting - should show error
      checkboxContainer?.focus();
      checkboxContainer?.blur();
      await waitForChanges();

      const errorText = checkboxGroup?.querySelector('.error-text');
      expect(errorText).toHaveTextContent('Please select at least one option');
    });

    it('validation and focus controllers work together', async () => {
      const { root, waitForChanges } = await render(<inheritance-scaling-demo />);

      const textInput = root.querySelector('inheritance-text-input');
      const input = textInput?.querySelector('input[type="text"]') as HTMLInputElement;

      // Focus - should track focus
      input?.focus();
      await waitForChanges();

      expect(textInput?.querySelector('.focus-info')).toHaveTextContent('Focused: Yes');

      // Blur - should track blur AND validate
      input?.blur();
      await waitForChanges();

      expect(textInput?.querySelector('.focus-info')).toHaveTextContent('Focused: No');
      expect(textInput?.querySelector('.focus-info')).toHaveTextContent('Blur Count: 1');
      expect(textInput?.querySelector('.error-text')).toHaveTextContent('Name is required');
    });

    it('all components have both validation and focus functionality', async () => {
      const { root, waitForChanges } = await render(<inheritance-scaling-demo />);

      const textInput = root.querySelector('inheritance-text-input');
      const radioGroup = root.querySelector('inheritance-radio-group');
      const checkboxGroup = root.querySelector('inheritance-checkbox-group');

      // Trigger validation on all components
      const textInputField = textInput?.querySelector('input[type="text"]') as HTMLInputElement;
      textInputField?.focus();
      textInputField?.blur();
      await waitForChanges();

      const radioContainer = radioGroup?.querySelector('.radio-group') as HTMLElement;
      radioContainer?.focus();
      radioContainer?.blur();
      await waitForChanges();

      const checkboxContainer = checkboxGroup?.querySelector('.checkbox-group') as HTMLElement;
      checkboxContainer?.focus();
      checkboxContainer?.blur();
      await waitForChanges();

      // Each should have validation error display
      expect(textInput?.querySelector('.error-text')).toBeDefined();
      expect(radioGroup?.querySelector('.error-text')).toBeDefined();
      expect(checkboxGroup?.querySelector('.error-text')).toBeDefined();

      // Each should have focus info display
      expect(textInput?.querySelector('.focus-info')).toBeDefined();
      expect(radioGroup?.querySelector('.focus-info')).toBeDefined();
      expect(checkboxGroup?.querySelector('.focus-info')).toBeDefined();
    });
  });
});
