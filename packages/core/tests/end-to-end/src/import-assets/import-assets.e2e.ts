import { newE2EPage } from '@stencil/core/testing';

describe('import assets', () => {
  it('should import .txt file', async () => {
    const page = await newE2EPage({
      html: '<import-assets></import-assets',
    });

    const txt = await page.find('#txt');
    expect(txt.textContent.trim()).toBe('My .txt File');

    const whateverHtml = await page.find('#whatever-html');
    expect(whateverHtml.textContent.trim()).toBe('<whatever></whatever>');

    const ionicSvgUrl: HTMLImageElement = (await page.find('#ionic-svg-url')) as any;
    expect(ionicSvgUrl.getAttribute('src')).toContain('data:image/svg+xml;base64,');

    const ionicSvgText = await page.find('#ionic-svg-text');
    expect(ionicSvgText.textContent).toContain('<svg xmlns=');
  });
});
