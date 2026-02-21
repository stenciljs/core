import { newE2EPage } from '@stencil/core/testing';

describe('Slots', () => {
  it('should render the slots in the correct order', async () => {
    const page = await newE2EPage({ html: '<slot-cmp-container></slot-cmp-container>' });

    const element = await page.find('slot-cmp-container');
    expect(element.shadowRoot.textContent).toContain('OneTwoThree');
  });
});
