import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('form associated', function () {
  beforeEach(async () => {
    render({
      template: () => (
        <form>
          <form-associated name="test-input"></form-associated>
          <input type="reset" value="Reset" />
        </form>
      ),
    });
  });

  it('should render without errors', async () => {
    const elm = $('form-associated');
    await expect(elm).toBePresent();
  });

  describe('form associated custom element lifecycle callback', () => {
    it('should trigger "formAssociated"', async () => {
      const formEl = $('form');
      await expect(formEl).toHaveProperty('ariaLabel', 'formAssociated called');
    });

    it('should trigger "formResetCallback"', async () => {
      const resetBtn = $('input[type="reset"]');
      await resetBtn.click();

      await resetBtn.waitForStable();

      const formEl = $('form');
      await expect(formEl).toHaveProperty('ariaLabel', 'formResetCallback called');
    });

    it('should trigger "formDisabledCallback"', async () => {
      const elm = document.body.querySelector('form-associated');
      const formEl = $('form');

      elm.setAttribute('disabled', 'disabled');

      await formEl.waitForStable();
      await expect(formEl).toHaveProperty('ariaLabel', 'formDisabledCallback called with true');

      elm.removeAttribute('disabled');
      await formEl.waitForStable();
      await expect(formEl).toHaveProperty('ariaLabel', 'formDisabledCallback called with false');
    });
  });

  it('should link up to the surrounding form', async () => {
    // this shows that the element has, through the `ElementInternals`
    // interface, been able to set a value in the surrounding form
    await browser.waitUntil(
      async () => {
        const formEl = document.body.querySelector('form');
        expect(new FormData(formEl).get('test-input')).toBe('my default value');
        return true;
      },
      { timeoutMsg: 'form associated value never changed' },
    );
  });
});
