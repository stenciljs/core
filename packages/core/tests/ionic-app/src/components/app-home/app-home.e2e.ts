import { newE2EPage } from '@stencil/core/testing';

describe('app-home', () => {
  it('renders', async () => {
    const page = await newE2EPage({ html: '<app-home></app-home>' });

    const element = await page.find('app-home');
    expect(element).toHaveClass('hydrated');
  });

  it('contains a "Profile Page" button', async () => {
    const page = await newE2EPage({ html: '<app-home></app-home>' });

    const element = await page.find('app-home ion-content ion-button');
    expect(element.textContent).toEqual('Profile page');
  });
});
