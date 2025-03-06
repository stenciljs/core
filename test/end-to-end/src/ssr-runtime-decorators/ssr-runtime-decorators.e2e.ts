import { E2EPage, newE2EPage } from '@stencil/core/testing';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];

describe('different types of decorated properties and states render on both server and client', () => {
  let page: E2EPage;
  let html: string;

  async function txt(className: string) {
    const ele = await page.find('.' + className);
    return ele.textContent;
  }
  function htmlTxt(className: string) {
    const match = html.match(new RegExp(`<div class="${className}".*?>(.*?)</div>`, 'g'));
    if (match && match[0]) {
      const textMatch = match[0].match(new RegExp(`<div class="${className}".*?>(.*?)</div>`));
      return textMatch ? textMatch[1].replace(/<!--.*?-->/g, '').trim() : null;
    }
    return null;
  }

  beforeAll(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../../hydrate');
    renderToString = mod.renderToString;
  });

  it('renders default values', async () => {
    const doc = await renderToString('<runtime-decorators></runtime-decorators>');
    html = doc.html;

    expect(htmlTxt('basicProp')).toBe('basicProp');
    expect(htmlTxt('decoratedProp')).toBe('-5');
    expect(htmlTxt('decoratedGetterSetterProp')).toBe('999');
    expect(htmlTxt('basicState')).toBe('basicState');
    expect(htmlTxt('decoratedState')).toBe('10');

    page = await newE2EPage({ html, url: 'https://stencil.com' });

    expect(await txt('basicProp')).toBe('basicProp');
    expect(await txt('decoratedProp')).toBe('-5');
    expect(await txt('decoratedGetterSetterProp')).toBe('999');
    expect(await txt('basicState')).toBe('basicState');
    expect(await txt('decoratedState')).toBe('10');
  });

  it('renders values via attributes', async () => {
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

    page = await newE2EPage({ html, url: 'https://stencil.com' });

    expect(await txt('basicProp')).toBe('basicProp via attribute');
    expect(await txt('decoratedProp')).toBe('25');
    expect(await txt('decoratedGetterSetterProp')).toBe('0');
    expect(await txt('basicState')).toBe('basicState');
    expect(await txt('decoratedState')).toBe('10');
  });

  it('renders values via properties', async () => {
    const doc = await renderToString(
      `
      <runtime-decorators></runtime-decorators>
    `,
      {
        beforeHydrate: (doc: Document) => {
          const el = doc.querySelector('runtime-decorators');
          el.basicProp = 'basicProp via prop';
          el.decoratedProp = 200;
          el.decoratedGetterSetterProp = -5;
          // @ts-ignore
          el.basicState = 'basicState via prop';
          // @ts-ignore
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

    page = await newE2EPage({ html, url: 'https://stencil.com' });

    expect(await txt('basicProp')).toBe('basicProp via prop');
    expect(await txt('decoratedProp')).toBe('25');
    expect(await txt('decoratedGetterSetterProp')).toBe('0');
    expect(await txt('basicState')).toBe('basicState');
    expect(await txt('decoratedState')).toBe('10');
  });

  it('renders different values on different component instances ', async () => {
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

    page = await newE2EPage({ html, url: 'https://stencil.com' });

    expect(await txt('basicProp')).toBe('basicProp');
    expect(await txt('decoratedProp')).toBe('-5');
    expect(await txt('decoratedGetterSetterProp')).toBe('999');
    expect(await txt('basicState')).toBe('basicState');
    expect(await txt('decoratedState')).toBe('10');
  });
});
