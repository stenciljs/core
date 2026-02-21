import { newE2EPage } from '@stencil/core/testing';

describe('app-root', () => {
  it('renders', async () => {
    const page = await newE2EPage({ url: '/' });

    const element = await page.find('app-root');
    expect(element).toHaveClass('hydrated');
  });

  it('renders an ion-app', async () => {
    const page = await newE2EPage({ url: '/' });

    const element = await page.find('app-root > ion-app');
    expect(element).toHaveClass('hydrated');
  });

  it('renders the ion-split-pane as visible', async () => {
    const page = await newE2EPage({ url: '/' });

    const splitPane = await page.find('app-root > ion-app > ion-split-pane');
    expect(splitPane).toHaveClass('split-pane-visible');

    const menu = await splitPane.find('ion-menu');
    expect(menu).toHaveClass('menu-pane-visible');

    const menuButton = await page.find('ion-menu-button');
    expect(menuButton).toHaveClass('menu-button-hidden');
  });
});
