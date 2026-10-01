import { render, h, describe, it, expect, waitForStable, waitForExist } from '@stencil/vitest';

describe('form associated', () => {
  it('should render without errors', async () => {
    const { root } = await render(
      <form>
        <form-associated name='test-input' />
        <input type='reset' value='Reset' />
      </form>,
    );
    expect(root.querySelector('form-associated')).toBeTruthy();
  });

  describe('form associated custom element lifecycle callback', () => {
    it('should trigger "formAssociated"', async () => {
      const { root } = await render(
        <form>
          <form-associated name='test-input' />
          <input type='reset' value='Reset' />
        </form>,
      );
      await waitForExist('form-associated.hydrated');
      const formEl = root as HTMLFormElement;
      expect(formEl.ariaLabel).toBe('formAssociated called');
    });

    it('should trigger "formResetCallback"', async () => {
      const { root, waitForChanges } = await render(
        <form>
          <form-associated name='test-input' />
          <input type='reset' value='Reset' />
        </form>,
      );
      await waitForExist('form-associated.hydrated');
      const formEl = root as HTMLFormElement;
      const resetBtn = formEl.querySelector('input[type="reset"]') as HTMLInputElement;

      resetBtn.click();
      await waitForChanges();
      await waitForStable('form');

      expect(formEl.ariaLabel).toBe('formResetCallback called');
    });

    it('should trigger "formDisabledCallback"', async () => {
      const { root, waitForChanges } = await render(
        <form>
          <form-associated name='test-input' />
          <input type='reset' value='Reset' />
        </form>,
      );

      await waitForExist('form-associated.hydrated');
      const formEl = root as HTMLFormElement;
      const elm = formEl.querySelector('form-associated')!;

      elm.setAttribute('disabled', 'disabled');
      await waitForChanges();
      await waitForStable('form');

      expect(formEl.ariaLabel).toBe('formDisabledCallback called with true');

      elm.removeAttribute('disabled');
      await waitForChanges();
      await waitForStable('form');

      expect(formEl.ariaLabel).toBe('formDisabledCallback called with false');
    });
  });

  it('should link up to the surrounding form', async () => {
    const { root } = await render(
      <form>
        <form-associated name='test-input' />
        <input type='reset' value='Reset' />
      </form>,
    );

    await waitForExist('form-associated.hydrated');
    const formEl = root as HTMLFormElement;
    // this shows that the element has, through the `ElementInternals`
    // interface, been able to set a value in the surrounding form
    expect(new FormData(formEl).get('test-input')).toBe('my default value');
  });
});

describe('form associated prop check', () => {
  it('treats a parsed `disabled="false"` and plain `disabled` attribute as true`', async () => {
    const { root } = await render(
      `<section>
        <form-associated-prop-check disabled></form-associated-prop-check>
        <form-associated-prop-check disabled="false"></form-associated-prop-check>
      </section>`,
    );

    await waitForExist('form-associated-prop-check.hydrated');

    const components = root.querySelectorAll(
      'form-associated-prop-check',
    ) as NodeListOf<HTMLFormAssociatedPropCheckElement>;
    expect(components[0].disabled).toBe(true);
    expect(components[1].disabled).toBe(true);

    expect(components[0].shadowRoot!.querySelector('p')).toHaveTextContent(
      'Disabled prop value: true',
    );
    expect(components[1].shadowRoot!.querySelector('p')).toHaveTextContent(
      'Disabled prop value: true',
    );
  });

  it('treats `setAttribute("disabled", "false")` as true and attribute removal as false', async () => {
    const { root, waitForChanges } = await render(<form-associated-prop-check />);
    await waitForExist('form-associated-prop-check.hydrated');

    const cmp = root as HTMLFormAssociatedPropCheckElement;
    const p = cmp.shadowRoot!.querySelector('p');
    expect(p).toHaveTextContent('Disabled prop value: undefined');

    cmp.setAttribute('disabled', 'false');
    await waitForChanges();
    expect(cmp.disabled).toBe(true);
    expect(p).toHaveTextContent('Disabled prop value: true');

    cmp.removeAttribute('disabled');
    await waitForChanges();
    expect(cmp.disabled).toBe(false);
    expect(p).toHaveTextContent('Disabled prop value: false');
  });
});
