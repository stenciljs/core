/**
 * Tests for `externalRuntime: true` build output.
 *
 * This verifies that components built with external runtime imports
 * (i.e., `import { ... } from '@stencil/core'` in the output) work
 * correctly when those imports are resolved by a bundler (vite).
 */
import { describe, it, expect, h, render } from '@stencil/vitest';

describe('external runtime - form associated', () => {
  it('should render without errors', async () => {
    const { root } = await render(
      <form>
        <form-associated-external name='test-input'></form-associated-external>
      </form>,
    );

    const el = root.querySelector('form-associated-external');
    expect(el).toBeTruthy();
    expect(el?.shadowRoot).toBeTruthy();
  });

  it('should trigger formAssociatedCallback', async () => {
    const { root } = await render(
      <form>
        <form-associated-external name='test-input'></form-associated-external>
      </form>,
    );

    expect(root.ariaLabel).toBe('formAssociated called');
  });

  it('should trigger formResetCallback', async () => {
    const { root, waitForChanges } = await render(
      <form>
        <form-associated-external name='test-input'></form-associated-external>
        <input type='reset' />
      </form>,
    );

    root.querySelector<HTMLInputElement>('input[type="reset"]')?.click();
    await waitForChanges();

    expect(root.ariaLabel).toBe('formResetCallback called');
  });

  it('should trigger formDisabledCallback', async () => {
    const { root, waitForChanges } = await render(
      <form>
        <form-associated-external name='test-input'></form-associated-external>
      </form>,
    );

    const el = root.querySelector('form-associated-external');

    el?.setAttribute('disabled', 'disabled');
    await waitForChanges();
    expect(root.ariaLabel).toBe('formDisabledCallback called with true');

    el?.removeAttribute('disabled');
    await waitForChanges();
    expect(root.ariaLabel).toBe('formDisabledCallback called with false');
  });

  it('should link up to the surrounding form', async () => {
    const { root } = await render<HTMLFormElement>(
      <form>
        <form-associated-external name='test-input'></form-associated-external>
      </form>,
    );

    const formData = new FormData(root);
    expect(formData.get('test-input')).toBe('my default value');
  });
});
