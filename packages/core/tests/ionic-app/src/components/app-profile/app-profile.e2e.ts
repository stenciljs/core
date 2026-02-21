import { newE2EPage } from '@stencil/core/testing';

describe('app-profile', () => {
  it('renders', async () => {
    const page = await newE2EPage({ html: '<app-profile></app-profile>' });

    const element = await page.find('app-profile');
    expect(element).toHaveClass('hydrated');
  });

  it('displays the specified name', async () => {
    const page = await newE2EPage({ url: '/profile/joseph' });

    const element = await page.find('app-profile ion-content p');
    expect(element.textContent).toContain('My name is Joseph.');
  });
});
