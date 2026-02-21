import { newE2EPage } from '@stencil/core/testing';

describe('dom interaction e2e tests', () => {
  it('should click button in shadow root', async () => {
    const page = await newE2EPage({
      html: `
      <dom-interaction></dom-interaction>
    `,
    });

    const button = await page.find('dom-interaction >>> .click');

    expect(button).toEqualText(`Click`);

    await button.click();

    expect(button).toEqualText(`Was Clicked`);
  });

  it('should focus button in shadow root', async () => {
    const page = await newE2EPage({
      html: `
      <dom-interaction></dom-interaction>
    `,
    });

    const button = await page.find('dom-interaction >>> .focus');

    expect(button).toEqualText(`Focus`);

    await button.tap();

    expect(button).toEqualText(`Has Focus`);
  });

  it('should tap button in shadow root', async () => {
    const page = await newE2EPage({
      html: `
      <dom-interaction></dom-interaction>
    `,
    });

    const button = await page.find('dom-interaction >>> .tap');

    expect(button).toEqualText(`Tap`);

    await button.tap();

    expect(button).toEqualText(`Was Tapped`);
  });

  it('should use press() to enter text in an input in the shadow root', async () => {
    const page = await newE2EPage({
      html: `
      <dom-interaction></dom-interaction>
    `,
    });

    const input = await page.find('dom-interaction >>> .input');

    let value = await input.getProperty('value');
    expect(value).toBe('');

    await input.press('8');
    await input.press('8');
    await input.press(' ');

    await page.keyboard.down('Shift');
    await input.press('KeyM');
    await input.press('KeyP');
    await input.press('KeyH');
    await page.keyboard.up('Shift');

    value = await input.getProperty('value');
    expect(value).toBe('88 MPH');
  });

  it('should use type() to enter text in an input in the shadow root', async () => {
    const page = await newE2EPage({
      html: `
      <dom-interaction></dom-interaction>
    `,
    });

    const input = await page.find('dom-interaction >>> .input');

    let value = await input.getProperty('value');
    expect(value).toBe('');

    await input.type('88 MPH');

    value = await input.getProperty('value');
    expect(value).toBe('88 MPH');
  });
});
