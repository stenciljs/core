import { describe, it, expect, render, h } from '@stencil/vitest';

/**
 * Test Case #16 - Composition-Based Scaling
 * This verifies that:
 * 1. 3 components (TextInput, RadioGroup, CheckboxGroup) work with composition
 * 2. 2 controllers (ValidationController, FocusController) work via composition
 * 3. Lifecycle methods are called automatically via ReactiveControllerHost
 * 4. Validation triggers on blur
 * 5. Focus tracking works
 * 6. Controllers are properly composed (not inherited)
 */
describe('extends-composition-scaling', () => {
  it('all 3 components render correctly', async () => {
    const { root, waitForChanges } = await render(<composition-scaling-demo />);
    await waitForChanges();

    expect(root).toBeTruthy();

    const textInput = root.querySelector('composition-text-input');
    const radioGroup = root.querySelector('composition-radio-group');
    const checkboxGroup = root.querySelector('composition-checkbox-group');

    expect(textInput).toBeTruthy();
    expect(radioGroup).toBeTruthy();
    expect(checkboxGroup).toBeTruthy();
  });

  it('text input validation works on blur', async () => {
    const { root, waitForChanges } = await render(<composition-text-input />);
    await waitForChanges();

    const input = root.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    // Focus and blur without entering value - should show error
    input.focus();
    input.blur();
    await waitForChanges();

    const errorText = root.querySelector('.error-text');
    expect(errorText?.textContent).toContain('Name is required');
  });

  it('text input focus tracking works', async () => {
    const { root, waitForChanges } = await render(<composition-text-input />);
    await waitForChanges();

    const input = root.querySelector('input[type="text"]') as HTMLInputElement;
    const focusInfo = root.querySelector('.focus-info');

    expect(input).toBeTruthy();
    expect(focusInfo).toBeTruthy();

    // Initial state should show not focused
    expect(focusInfo?.textContent).toContain('Focused: No');
    expect(focusInfo?.textContent).toContain('Focus Count: 0');

    // Focus the input
    input.focus();
    await waitForChanges();

    let info = root.querySelector('.focus-info')?.textContent;
    expect(info).toContain('Focused: Yes');
    expect(info).toContain('Focus Count: 1');

    // Blur the input
    input.blur();
    await waitForChanges();

    info = root.querySelector('.focus-info')?.textContent;
    expect(info).toContain('Focused: No');
    expect(info).toContain('Blur Count: 1');
  });

  it('radio group validation works on blur', async () => {
    const { root, waitForChanges } = await render(<composition-radio-group />);
    await waitForChanges();

    const radioContainer = root.querySelector('.radio-group') as HTMLElement;
    expect(radioContainer).toBeTruthy();

    // Focus and blur without selecting - should show error
    radioContainer.focus();
    radioContainer.blur();
    await waitForChanges();

    const errorText = root.querySelector('.error-text');
    expect(errorText?.textContent).toContain('Please select an option');
  });

  it('checkbox group validation works on blur', async () => {
    const { root, waitForChanges } = await render(<composition-checkbox-group />);
    await waitForChanges();

    const checkboxContainer = root.querySelector('.checkbox-group') as HTMLElement;
    expect(checkboxContainer).toBeTruthy();

    // Focus and blur without selecting - should show error
    checkboxContainer.focus();
    checkboxContainer.blur();
    await waitForChanges();

    const errorText = root.querySelector('.error-text');
    expect(errorText?.textContent).toContain('Please select at least one option');
  });

  it('validation and focus controllers work together', async () => {
    const { root, waitForChanges } = await render(<composition-text-input />);
    await waitForChanges();

    const input = root.querySelector('input[type="text"]') as HTMLInputElement;

    // Focus - should track focus
    input.focus();
    await waitForChanges();

    let focusInfo = root.querySelector('.focus-info')?.textContent;
    expect(focusInfo).toContain('Focused: Yes');

    // Blur - should track blur AND validate
    input.blur();
    await waitForChanges();

    focusInfo = root.querySelector('.focus-info')?.textContent;
    const errorText = root.querySelector('.error-text');
    expect(focusInfo).toContain('Focused: No');
    expect(focusInfo).toContain('Blur Count: 1');
    expect(errorText?.textContent).toContain('Name is required');
  });

  it('validates that all components have focus and validation capability', async () => {
    const { root, waitForChanges } = await render(<composition-scaling-demo />);
    await waitForChanges();

    const textInput = root.querySelector('composition-text-input');
    const radioGroup = root.querySelector('composition-radio-group');
    const checkboxGroup = root.querySelector('composition-checkbox-group');

    // Each should have focus info display
    expect(textInput?.querySelector('.focus-info')).toBeTruthy();
    expect(radioGroup?.querySelector('.focus-info')).toBeTruthy();
    expect(checkboxGroup?.querySelector('.focus-info')).toBeTruthy();

    // Trigger validation on each to show errors
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

    expect(textInput?.querySelector('.error-text')).toBeTruthy();
    expect(radioGroup?.querySelector('.error-text')).toBeTruthy();
    expect(checkboxGroup?.querySelector('.error-text')).toBeTruthy();
  });

  it('controllers are automatically called during lifecycle via ReactiveControllerHost', async () => {
    const { root, waitForChanges } = await render(<composition-text-input />);
    await waitForChanges();

    const input = root.querySelector('input[type="text"]') as HTMLInputElement;

    // The fact that validation and focus tracking work proves that:
    // 1. Controllers' hostDidLoad() was called automatically
    // 2. Controllers are properly registered with ReactiveControllerHost
    // 3. Lifecycle methods are chained automatically

    // Verify controllers are working (which proves lifecycle was called)
    input.focus();
    await waitForChanges();

    const focusInfo = root.querySelector('.focus-info')?.textContent;
    expect(focusInfo).toContain('Focus Count: 1');

    // This proves the composition pattern works:
    // - Component extends ReactiveControllerHost
    // - Controllers are instantiated and added automatically
    // - Lifecycle methods are called automatically via base class
  });
});
