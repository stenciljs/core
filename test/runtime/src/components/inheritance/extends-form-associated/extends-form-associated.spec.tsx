import { describe, it, expect, render, h, waitForExist } from '@stencil/vitest';

describe('extends-form-associated', () => {
  it('renders a component that extends a form-associated component', async () => {
    const { root } = await render(
      <form>
        <extends-form-associated-derived />
      </form>,
    );
    await waitForExist('extends-form-associated-derived.hydrated');
    const element = root.querySelector('extends-form-associated-derived') as HTMLElement & {
      hasInternals(): Promise<boolean>;
    };

    expect(element.shadowRoot!.querySelector('input')!.value).toBe('derived');
    expect(await element.hasInternals()).toBe(true);
  });
});
