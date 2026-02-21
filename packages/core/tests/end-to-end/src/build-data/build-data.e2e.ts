import { newE2EPage } from '@stencil/core/testing';

describe('build-data e2e', () => {
  it('should navigate to the index.html page w/out url searchParams', async () => {
    // create a new puppeteer page
    // and go to the root webpage
    const page = await newE2EPage({
      html: `<build-data></build-data>`,
    });
    const element = await page.find('build-data');
    expect(element).toEqualHtml(`
      <build-data custom-hydrate-flag="">
        <p>isDev: true</p>
        <p>isBrowser: true</p>
        <p>isTesting: true</p>
      </build-data>
    `);
  });
});
