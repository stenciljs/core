import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('extends-form-associated', () => {
  before(() => {
    render({
      template: () => (
        <form>
          <extends-form-associated-derived />
        </form>
      ),
    });
  });

  it('renders a component that extends a form-associated component', async () => {
    const element = document.querySelector('extends-form-associated-derived') as HTMLElement & {
      componentOnReady(): Promise<unknown>;
      hasInternals(): Promise<boolean>;
    };
    await element.componentOnReady();

    expect(element.shadowRoot.querySelector('input').value).toBe('derived');
    expect(await element.hasInternals()).toBe(true);
  });
});
