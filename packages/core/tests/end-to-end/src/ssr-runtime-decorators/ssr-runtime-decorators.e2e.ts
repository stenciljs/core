import { expect, Page } from '@playwright/test';
import { test } from '@stencil/playwright';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];

test.describe('different types of decorated properties and states render on both server and client', () => {
  let page: Page;
  let html: string;

  async function txt(className: string) {
    const ele = page.locator('.' + className).first();
    return await ele.textContent();
  }

  function htmlTxt(className: string) {
    const match = html.match(new RegExp(`<div class="${className}".*?>(.*?)</div>`, 'g'));
    if (match && match[0]) {
      const textMatch = match[0].match(new RegExp(`<div class="${className}".*?>(.*?)</div>`));
      return textMatch ? textMatch[1].replace(/<!--.*?-->/g, '').trim() : null;
    }
    return null;
  }

  test.beforeAll(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../../hydrate');
    renderToString = mod.renderToString;
  });

  test('renders default values', async ({ page: p }) => {
    page = p;
    const doc = await renderToString('<runtime-decorators></runtime-decorators>');
    html = doc.html;

    expect(htmlTxt('basicProp')).toBe('basicProp');
    expect(htmlTxt('decoratedProp')).toBe('-5');
    expect(htmlTxt('decoratedGetterSetterProp')).toBe('999');
    expect(htmlTxt('basicState')).toBe('basicState');
    expect(htmlTxt('decoratedState')).toBe('10');

    await page.setContent(html);

    expect(await txt('basicProp')).toBe('basicProp');
    expect(await txt('decoratedProp')).toBe('-5');
    expect(await txt('decoratedGetterSetterProp')).toBe('999');
    expect(await txt('basicState')).toBe('basicState');
    expect(await txt('decoratedState')).toBe('10');
  });

  test('renders values via attributes', async ({ page: p }) => {
    page = p;
    const doc = await renderToString(`
      <runtime-decorators
        decorated-prop="200"
        decorated-getter-setter-prop="-5"
        basic-prop="basicProp via attribute"
        basic-state="basicState via attribute"
        decorated-state="decoratedState via attribute"
      ></runtime-decorators>
    `);
    html = doc.html;

    expect(htmlTxt('basicProp')).toBe('basicProp via attribute');
    expect(htmlTxt('decoratedProp')).toBe('25');
    expect(htmlTxt('decoratedGetterSetterProp')).toBe('0');
    expect(htmlTxt('basicState')).toBe('basicState');
    expect(htmlTxt('decoratedState')).toBe('10');

    await page.setContent(html);

    expect(await txt('basicProp')).toBe('basicProp via attribute');
    expect(await txt('decoratedProp')).toBe('25');
    expect(await txt('decoratedGetterSetterProp')).toBe('0');
    expect(await txt('basicState')).toBe('basicState');
    expect(await txt('decoratedState')).toBe('10');
  });

  test('renders values via properties', async ({ page: p }) => {
    page = p;
    const doc = await renderToString(
      `
      <runtime-decorators></runtime-decorators>
    `,
      {
        beforeHydrate: (doc: Document) => {
          const el = doc.querySelector('runtime-decorators') as any;
          el.basicProp = 'basicProp via prop';
          el.decoratedProp = 200;
          el.decoratedGetterSetterProp = -5;
          el.basicState = 'basicState via prop';
          el.decoratedState = 'decoratedState via prop';
        },
      },
    );
    html = doc.html;

    expect(htmlTxt('basicProp')).toBe('basicProp via prop');
    expect(htmlTxt('decoratedProp')).toBe('25');
    expect(htmlTxt('decoratedGetterSetterProp')).toBe('0');
    expect(htmlTxt('basicState')).toBe('basicState');
    expect(htmlTxt('decoratedState')).toBe('10');

    await page.setContent(html);

    expect(await txt('basicProp')).toBe('basicProp via prop');
    expect(await txt('decoratedProp')).toBe('25');
    expect(await txt('decoratedGetterSetterProp')).toBe('0');
    expect(await txt('basicState')).toBe('basicState');
    expect(await txt('decoratedState')).toBe('10');
  });

  test('renders different values on different component instances', async ({ page: p }) => {
    page = p;
    const doc = await renderToString(`
      <runtime-decorators></runtime-decorators>
      <runtime-decorators
        decorated-prop="200"
        decorated-getter-setter-prop="-5"
        basic-prop="basicProp via attribute"
        basic-state="basicState via attribute"
        decorated-state="decoratedState via attribute"
      ></runtime-decorators>
    `);
    html = doc.html;

    // first component should have default values
    expect(htmlTxt('basicProp')).toBe('basicProp');
    expect(htmlTxt('decoratedProp')).toBe('-5');
    expect(htmlTxt('decoratedGetterSetterProp')).toBe('999');
    expect(htmlTxt('basicState')).toBe('basicState');
    expect(htmlTxt('decoratedState')).toBe('10');

    await page.setContent(html);

    expect(await txt('basicProp')).toBe('basicProp');
    expect(await txt('decoratedProp')).toBe('-5');
    expect(await txt('decoratedGetterSetterProp')).toBe('999');
    expect(await txt('basicState')).toBe('basicState');
    expect(await txt('decoratedState')).toBe('10');
  });
});
