import { expect, Page } from '@playwright/test';
import { test } from '@stencil/playwright';

import { CarData } from '../src/components/car-list/car-data';

const vento = new CarData('VW', 'Vento', 2024);

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../dist/ssr/index.js');
let renderToString: HydrateModule['renderToString'];
let resetSsrDocData: HydrateModule['resetSsrDocData'];

test.describe('props serialization', () => {
  test.beforeEach(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../dist/ssr/index.js');
    renderToString = mod.renderToString;
    resetSsrDocData = mod.resetSsrDocData;
    resetSsrDocData();
  });

  test.describe('basic props', () => {
    test('supports passing props to components via JSON string', async () => {
      const { html } = await renderToString(
        '<another-car-detail car=\'{"year":2024, "make": "VW", "model": "Vento"}\'></another-car-detail>',
        {
          serializeShadowRoot: true,
          fullDocument: false,
          prettyHtml: true,
          clientSsrAnnotations: false,
        },
      );
      expect(html || '').toMatchSnapshot();
      expect(html || '').toContain('2024 VW Vento');
    });

    test('supports passing props to components with a simple object', async () => {
      const { html } = await renderToString(
        `<another-car-detail car=${JSON.stringify(vento)}></another-car-detail>`,
        {
          serializeShadowRoot: true,
          fullDocument: false,
          prettyHtml: true,
          clientSsrAnnotations: false,
        },
      );
      expect(html || '').toMatchSnapshot();
      expect(html || '').toContain('2024 VW Vento');
    });

    test('does not fail if provided object is not a valid JSON', async () => {
      const { html } = await renderToString(
        `<another-car-detail car='{"year":2024, "make": "VW", "model": "Vento"'></another-car-detail>`,
        {
          serializeShadowRoot: true,
          fullDocument: false,
          clientSsrAnnotations: false,
        },
      );
      expect(html || '').toContain('<section class="sc-another-car-detail"></section>');
    });
  });

  test.describe('kebab vs camelCase props', () => {
    test('renders kebab and camel case props correctly', async () => {
      const { html } = await renderToString(
        `
        <my-cmp foo-prop="foo1" bar-prop="bar1"></my-cmp>
        <my-cmp fooProp="foo2" barProp="bar2"></my-cmp>
      `,
        { fullDocument: false },
      );
      // html template renders kebab case props
      expect(html || '').toContain('<!--t.1.1.1.0-->foo1 - bar1<');
      // html template doesn't support camelcase
      expect(html || '').toContain('<!--t.4.1.1.0--> - bar<');
      // jsx template renders kebab case
      expect(html || '').toContain('<!--t.2.1.1.0-->foo3 - bar3<');
      expect(html || '').toContain('<!--t.5.1.1.0-->foo3 - bar3<');
      // jsx template renders camel case
      expect(html || '').toContain('<!--t.3.1.1.0-->foo4 - bar4<');
      expect(html || '').toContain('<!--t.6.1.1.0-->foo4 - bar4<');
    });
  });

  test.describe('complex properties (Map, Set, Symbol)', () => {
    /**
     * Serialize complex types to extended JSON format.
     * This matches the deserializeExtendedJSON function in complex-properties.tsx.
     */
    function serializeExtendedJSON(value: any): string {
      return JSON.stringify(value, (_key, val) => {
        if (val instanceof Map) {
          return { __type: 'Map', value: Array.from(val.entries()) };
        }
        if (val instanceof Set) {
          return { __type: 'Set', value: Array.from(val) };
        }
        if (typeof val === 'symbol') {
          return { __type: 'Symbol', value: val.description };
        }
        if (val === Infinity) {
          return { __type: 'Infinity' };
        }
        return val;
      });
    }

    const getTemplate = () => `<complex-properties
      foo=${serializeExtendedJSON({ bar: 123, loo: [1, 2, 3], qux: { quux: Symbol('quux') } })}
      baz=${serializeExtendedJSON(new Map([['foo', { qux: Symbol('quux') }]]))}
      quux=${serializeExtendedJSON(new Set(['foo']))}
      grault=${serializeExtendedJSON(Infinity)}
      waldo=${serializeExtendedJSON(null)}
      kids-names=${serializeExtendedJSON(['John', 'Jane', 'Jim'])}
    />`;

    test('should render complex properties via renderToString', async () => {
      const template = getTemplate();
      const { html } = await renderToString(template, {
        prettyHtml: true,
        fullDocument: false,
      });
      expect(html || '').toMatchSnapshot();
    });

    test('can render component and verify serialized properties hydrate correctly', async ({
      page,
    }) => {
      const template = getTemplate();
      const { html } = await renderToString(template, { fullDocument: true });

      await page.setContent(html || '');
      await page.waitForSelector('complex-properties[custom-hydrate-flag]');

      const text = await page.evaluate(() => {
        return document.querySelector('complex-properties')?.shadowRoot?.querySelector('ul')
          ?.textContent;
      });
      expect(text).toContain('this.foo.bar: 123');
      expect(text).toContain('this.foo.loo: 1, 2, 3');
      expect(text).toContain('this.foo.qux: symbol');
      expect(text).toContain("this.baz.get('foo'): symbol");
      expect(text).toContain("this.quux.has('foo'): true");
      expect(text).toContain('this.grault: true');
      expect(text).toContain('this.waldo: true');
      expect(text).toContain('this.kidsNames: John, Jane, Jim');
    });

    test('can change a complex property and see it updated correctly', async ({ page }) => {
      const template = getTemplate();
      const { html } = await renderToString(template, { fullDocument: true });

      await page.setContent(html || '');
      await page.waitForSelector('complex-properties[custom-hydrate-flag]');

      await page.evaluate(() => {
        const elm = document.querySelector('complex-properties') as any;
        elm.foo = { bar: '456', loo: [4, 5, 6], qux: { quux: Symbol('new quux') } };
        elm.kidsNames.push('Jill');
      });

      await page.waitForFunction(() => {
        const elm = document.querySelector('complex-properties');
        return elm?.shadowRoot?.querySelector('ul')?.textContent?.includes('456');
      });

      const text = await page.evaluate(() => {
        return document.querySelector('complex-properties')?.shadowRoot?.querySelector('ul')
          ?.textContent;
      });
      expect(text).toContain('this.foo.bar: 456');
      expect(text).toContain('this.foo.loo: 4, 5, 6');
      expect(text).toContain('this.kidsNames: John, Jane, Jim, Jill');
    });
  });

  test.describe('serialize/deserialize', () => {
    test('serializes and deserializes on server and client', async ({ page }) => {
      const { html } = await renderToString(`<serialize-deserializer />`, { prettyHtml: true });

      expect(html || '').toContain('array="[&quot;a&quot;,&quot;b&quot;,&quot;c&quot;]"');
      expect(html || '').toContain('get-set="{&quot;foo&quot;:&quot;bar&quot;}"');

      await page.setContent(html || '');
      await page.waitForSelector('serialize-deserializer[custom-hydrate-flag]');

      const arrayProp = await page.evaluate(() => {
        const root = document.querySelector('serialize-deserializer') as any;
        return root.array;
      });
      expect(arrayProp).toEqual(['a', 'b', 'c']);

      const getSetProp = await page.evaluate(() => {
        const root = document.querySelector('serialize-deserializer') as any;
        return root.getSet;
      });
      expect(getSetProp).toEqual({ foo: 'bar' });
    });
  });

  test.describe('runtime decorators (@Prop, @State)', () => {
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

    test('renders default values', async ({ page: p }) => {
      page = p;
      const doc = await renderToString('<runtime-decorators></runtime-decorators>');
      html = doc.html || '';

      expect(htmlTxt('basicProp')).toBe('basicProp');
      expect(htmlTxt('decoratedProp')).toBe('-5');
      expect(htmlTxt('decoratedGetterSetterProp')).toBe('999');
      expect(htmlTxt('basicState')).toBe('basicState');
      expect(htmlTxt('decoratedState')).toBe('10');

      await page.setContent(html || '');

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
      html = doc.html || '';

      expect(htmlTxt('basicProp')).toBe('basicProp via attribute');
      expect(htmlTxt('decoratedProp')).toBe('25');
      expect(htmlTxt('decoratedGetterSetterProp')).toBe('0');

      await page.setContent(html || '');

      expect(await txt('basicProp')).toBe('basicProp via attribute');
      expect(await txt('decoratedProp')).toBe('25');
      expect(await txt('decoratedGetterSetterProp')).toBe('0');
    });

    test('renders values via properties (beforeSsr)', async ({ page: p }) => {
      page = p;
      const doc = await renderToString(`<runtime-decorators></runtime-decorators>`, {
        beforeSsr: (doc: Document) => {
          const el = doc.querySelector('runtime-decorators') as any;
          el.basicProp = 'basicProp via prop';
          el.decoratedProp = 200;
          el.decoratedGetterSetterProp = -5;
        },
      });
      html = doc.html || '';

      expect(htmlTxt('basicProp')).toBe('basicProp via prop');
      expect(htmlTxt('decoratedProp')).toBe('25');
      expect(htmlTxt('decoratedGetterSetterProp')).toBe('0');

      await page.setContent(html || '');

      expect(await txt('basicProp')).toBe('basicProp via prop');
      expect(await txt('decoratedProp')).toBe('25');
      expect(await txt('decoratedGetterSetterProp')).toBe('0');
    });

    test('renders different values on different component instances', async ({ page: p }) => {
      page = p;
      const doc = await renderToString(`
        <runtime-decorators></runtime-decorators>
        <runtime-decorators
          decorated-prop="200"
          basic-prop="basicProp via attribute"
        ></runtime-decorators>
      `);
      html = doc.html || '';

      // first component should have default values
      expect(htmlTxt('basicProp')).toBe('basicProp');
      expect(htmlTxt('decoratedProp')).toBe('-5');

      await page.setContent(html || '');

      expect(await txt('basicProp')).toBe('basicProp');
      expect(await txt('decoratedProp')).toBe('-5');
    });
  });
});
