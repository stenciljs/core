import { Readable } from 'node:stream';

import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

import { CarData } from '../car-list/car-data';

const vento = new CarData('VW', 'Vento', 2024);
const beetle = new CarData('VW', 'Beetle', 2023);

async function readableToString(readable: Readable) {
  return new Promise((resolve, reject) => {
    let data = '';

    readable.on('data', (chunk) => {
      data += chunk;
    });

    readable.on('end', () => {
      resolve(data);
    });

    readable.on('error', (err) => {
      reject(err);
    });
  });
}

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];
let streamToString: HydrateModule['streamToString'];
let hydrateDocument: HydrateModule['hydrateDocument'];
let createWindowFromHtml: HydrateModule['createWindowFromHtml'];

test.describe('renderToString', () => {
  test.beforeAll(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../../hydrate');
    renderToString = mod.renderToString;
    streamToString = mod.streamToString;
    hydrateDocument = mod.hydrateDocument;
    createWindowFromHtml = mod.createWindowFromHtml;
  });

  test('resolves to a Promise<HydrateResults> by default', async () => {
    const renderedString = renderToString('<div>Hello World</div>');
    expect(typeof renderedString.then).toBe('function');
    // this is a type assertion to verify that the promise resolves to a HydrateResults object
    renderedString.then((result) => result.html);

    const renderedDocument = hydrateDocument('<div>Hello World</div>');
    expect(typeof renderedDocument.then).toBe('function');
    // this is a type assertion to verify that the promise resolves to a HydrateResults object
    renderedDocument.then((result) => result.html);
  });

  test('can render a simple dom node', async () => {
    const { html } = await renderToString('<div>Hello World</div>');
    expect(html).toContain('<body><div>Hello World</div></body>');
  });

  test('can render a simple dom node (sync)', async () => {
    const input = '<div>Hello World</div>';
    const renderedHTML = '<body><div>Hello World</div></body>';
    const stream = renderToString(input, {}, true);
    expect(await readableToString(stream)).toContain(renderedHTML);
    expect(await readableToString(streamToString(input))).toContain(renderedHTML);
  });

  test('can render a simple shadow component', async () => {
    const { html } = await renderToString('<another-car-detail></another-car-detail>', {
      serializeShadowRoot: true,
      fullDocument: false,
      prettyHtml: true,
    });
    expect(html).toMatchSnapshot();
  });

  test('supports passing props to components', async () => {
    const { html } = await renderToString(
      '<another-car-detail car=\'{"year":2024, "make": "VW", "model": "Vento"}\'></another-car-detail>',
      {
        serializeShadowRoot: true,
        fullDocument: false,
        prettyHtml: true,
      },
    );

    expect(html).toMatchSnapshot();
    expect(html).toContain('2024 VW Vento');
  });

  test('supports passing props to components with a simple object', async () => {
    const { html } = await renderToString(`<another-car-detail car=${JSON.stringify(vento)}></another-car-detail>`, {
      serializeShadowRoot: true,
      fullDocument: false,
      prettyHtml: true,
    });
    expect(html).toMatchSnapshot();
    expect(html).toContain('2024 VW Vento');
  });

  test('does not fail if provided object is not a valid JSON', async () => {
    const { html } = await renderToString(
      `<another-car-detail car='{"year":2024, "make": "VW", "model": "Vento"'></another-car-detail>`,
      {
        serializeShadowRoot: true,
        fullDocument: false,
      },
    );
    expect(html).toContain('<section class="sc-another-car-detail" c-id="4.0.0.0"><!--t.4.1.1.0--> </section>');
  });

  test('supports styles for DSD', async () => {
    const { html } = await renderToString('<another-car-detail></another-car-detail>', {
      serializeShadowRoot: true,
      fullDocument: false,
    });
    expect(html).toContain(
      '<template shadowrootmode="open"><style sty-id="sc-another-car-detail">section{color:green}</style>',
    );
  });

  test('only returns the element if we render to DSD', async () => {
    const { html } = await renderToString('<div>Hello World</div>', {
      serializeShadowRoot: true,
      fullDocument: false,
    });
    expect(html).toBe('<div>Hello World</div>');
  });

  test('can render nested components', async () => {
    const { html } = await renderToString(
      `<another-car-list cars='${JSON.stringify([vento, beetle])}'></another-car-list>`,
      {
        serializeShadowRoot: true,
        fullDocument: false,
        prettyHtml: true,
      },
    );
    expect(html).toMatchSnapshot();
    expect(html).toContain('2024 VW Vento');
    expect(html).toContain('2023 VW Beetle');
  });

  test('can render a scoped component within a shadow component', async () => {
    const { html } = await renderToString(`<car-list cars='${JSON.stringify([vento, beetle])}'></car-list>`, {
      serializeShadowRoot: true,
      fullDocument: false,
    });
    expect(html).toMatchSnapshot();
    expect(html).toContain(
      `<car-detail class=\"sc-car-list\" custom-hydrate-flag=\"\" c-id=\"9.2.2.0\" s-id=\"10\"><!--r.10--><section c-id=\"10.0.0.0\"><!--t.10.1.1.0-->2024 VW Vento</section></car-detail>`,
    );
    expect(html).toContain(
      `<car-detail class=\"sc-car-list\" custom-hydrate-flag=\"\" c-id=\"9.4.2.0\" s-id=\"11\"><!--r.11--><section c-id=\"11.0.0.0\"><!--t.11.1.1.0-->2023 VW Beetle</section></car-detail>`,
    );
  });

  test('can render a scoped component within a shadow component (sync)', async () => {
    const input = `<car-list cars=${JSON.stringify([vento, beetle])}></car-list>`;
    const opts = {
      serializeShadowRoot: true,
      fullDocument: false,
    };

    const resultRenderToString = await readableToString(renderToString(input, opts, true));
    expect(resultRenderToString).toContain(
      '<car-detail class="sc-car-list" custom-hydrate-flag="" c-id="12.2.2.0" s-id="13"><!--r.13--><section c-id="13.0.0.0"><!--t.13.1.1.0-->2024 VW Vento</section></car-detail>',
    );
    expect(resultRenderToString).toContain(
      '<car-detail class="sc-car-list" custom-hydrate-flag="" c-id="12.4.2.0" s-id="14"><!--r.14--><section c-id="14.0.0.0"><!--t.14.1.1.0-->2023 VW Beetle</section></car-detail>',
    );

    const resultStreamToString = await readableToString(streamToString(input, opts));
    expect(resultStreamToString).toContain(
      '<car-detail class="sc-car-list" custom-hydrate-flag="" c-id="15.2.2.0" s-id="16"><!--r.16--><section c-id="16.0.0.0"><!--t.16.1.1.0-->2024 VW Vento</section></car-detail>',
    );
    expect(resultStreamToString).toContain(
      '<car-detail class="sc-car-list" custom-hydrate-flag="" c-id="15.4.2.0" s-id="17"><!--r.17--><section c-id="17.0.0.0"><!--t.17.1.1.0-->2023 VW Beetle</section></car-detail>',
    );
  });

  test('can take over a server side rendered component and re-render it in the browser', async ({ page }) => {
    const { html } = await renderToString('<cmp-dsd></cmp-dsd>', {
      serializeShadowRoot: true,
      fullDocument: false,
    });

    expect(html).toContain('Count me: 0!');
    await page.setContent(html);

    const button = page.locator('cmp-dsd').locator('button');
    await button.click();
    await expect(button).toHaveText('Count me: 1!');
  });

  test('can take over a server side rendered component and re-render it in the browser with applied prop', async ({
    page,
  }) => {
    const { html } = await renderToString('<cmp-dsd initial-counter="42"></cmp-dsd>', {
      serializeShadowRoot: true,
      fullDocument: false,
    });

    expect(html).toContain('Count me: 42!');
    await page.setContent(html);

    const button = page.locator('cmp-dsd').locator('button');
    await button.click();
    await expect(button).toHaveText('Count me: 43!');
  });

  test('can render server side component when client sender renders differently', async ({ page }) => {
    const { html } = await renderToString('<cmp-server-vs-client></cmp-server-vs-client>', {
      serializeShadowRoot: true,
      fullDocument: false,
    });

    expect(html).toContain('Server vs Client? Winner: Server');
    await page.setContent(html);

    const div = page.locator('cmp-server-vs-client').locator('div');
    await expect(div).toHaveText('Server vs Client? Winner: Client');
  });

  test('can hydrate components with event listeners', async ({ page }) => {
    const { html } = await renderToString(
      `
      <dsd-listen-cmp>Hello World</dsd-listen-cmp>
      <car-list cars=${JSON.stringify([vento, beetle])}></car-list>
    `,
      {
        serializeShadowRoot: true,
        fullDocument: true,
      },
    );

    /**
     * renders the component with listener with proper vdom annotation
     */
    expect(html).toContain(
      `<dsd-listen-cmp class=\"sc-dsd-listen-cmp-h\" custom-hydrate-flag=\"\" s-id=\"21\"><template shadowrootmode=\"open\"><style sty-id="sc-dsd-listen-cmp">:host{display:block}</style><slot class=\"sc-dsd-listen-cmp\" c-id=\"21.0.0.0\"></slot></template><!--r.21-->Hello World</dsd-listen-cmp>`,
    );

    /**
     * renders second component with proper vdom annotation
     */
    expect(html).toContain(
      `<car-detail class=\"sc-car-list\" custom-hydrate-flag=\"\" c-id=\"22.4.2.0\" s-id=\"24\"><!--r.24--><section c-id=\"24.0.0.0\"><!--t.24.1.1.0-->2023 VW Beetle</section></car-detail>`,
    );

    await page.setContent(html);

    const cars = page.locator('car-detail');
    const carTexts = await cars.allTextContents();
    expect(carTexts).toEqual(['2024 VW Vento', '2023 VW Beetle']);
  });

  test('calls beforeHydrate and afterHydrate function hooks', async () => {
    let beforeHydrateCalled = 0;
    let afterHydrateCalled = 0;

    const beforeHydrate = (doc: Document) => {
      beforeHydrateCalled++;
      const div = doc.querySelector('div');
      if (div) div.textContent = 'Hello Universe';
    };
    const afterHydrate = () => {
      afterHydrateCalled++;
    };

    const { html } = await renderToString('<div>Hello World</div>', {
      beforeHydrate,
      afterHydrate,
    });

    expect(beforeHydrateCalled).toBe(1);
    expect(afterHydrateCalled).toBe(1);
    expect(html).toContain('<body><div>Hello Universe</div></body>');
  });

  test('does not render a shadow component if serializeShadowRoot is false', async () => {
    const { html } = await renderToString('<another-car-detail></another-car-detail>', {
      serializeShadowRoot: false,
      fullDocument: false,
    });
    expect(html).toBe(
      '<another-car-detail class="sc-another-car-detail-h" custom-hydrate-flag="" s-id="25"><!--r.25--></another-car-detail>',
    );
  });

  test('does not render a shadow component but its light dom', async () => {
    const { html } = await renderToString('<cmp-with-slot>Hello World</cmp-with-slot>', {
      serializeShadowRoot: false,
      fullDocument: false,
    });
    expect(html).toBe(
      '<cmp-with-slot class="sc-cmp-with-slot-h" custom-hydrate-flag="" s-id="26"><!--r.26-->Hello World</cmp-with-slot>',
    );
  });

  test.describe('modes in declarative shadow dom', () => {
    test('renders components in ios mode', async ({ page }) => {
      const { html } = await renderToString('<prop-cmp first="Max" last="Mustermann"></prop-cmp>', {
        fullDocument: false,
        prettyHtml: true,
        modes: [() => 'ios'],
      });
      expect(html).toContain('<style sty-id="sc-prop-cmp-ios">');
      expect(html).toContain(';color:white;');

      await page.setContent(html);

      const div = page.locator('prop-cmp').locator('div');
      const color = await div.evaluate((el) => getComputedStyle(el).color);
      expect(color).toBe('rgb(255, 255, 255)');
    });

    test('renders components in md mode', async ({ page }) => {
      const { html } = await renderToString('<prop-cmp first="Max" last="Mustermann"></prop-cmp>', {
        fullDocument: false,
        prettyHtml: true,
        modes: [() => 'md'],
      });
      expect(html).toContain(';color:black;');

      await page.setContent(html);

      const div = page.locator('prop-cmp').locator('div');
      const color = await div.evaluate((el) => getComputedStyle(el).color);
      expect(color).toBe('rgb(0, 0, 0)');
    });
  });

  test('does not render the shadow root twice', async () => {
    const { html } = await renderToString(
      `
      <nested-cmp-parent>
        <nested-cmp-child custom-hydrate-flag="" s-id="3">
          <template shadowrootmode="open">
            <div c-id="3.0.0.0" class="some-other-class">
              <slot c-id="3.1.1.0"></slot>
            </div>
          </template>
          <!--r.3-->
          Hello World
        </nested-cmp-child>
      </nested-cmp-parent>
    `,
      {
        fullDocument: false,
        prettyHtml: true,
      },
    );
    expect(html).toBe(`<nested-cmp-parent class="sc-nested-cmp-parent-h" custom-hydrate-flag="" s-id="29">
  <template shadowrootmode="open">
    <style sty-id="sc-nested-cmp-parent">
      .sc-nested-scope-cmp-h{color:green}:host{display:inline-block}
    </style>
    <div c-id="29.0.0.0" class="sc-nested-cmp-parent some-class">
      <nested-scope-cmp c-id="29.1.1.0" class="sc-nested-cmp-parent sc-nested-scope-cmp-h" custom-hydrate-flag="" s-id="31">
        <!--r.31-->
        <!--o.29.2.c-->
        <div c-id="31.0.0.0" class="sc-nested-scope-cmp sc-nested-scope-cmp-s some-scope-class">
          <!--s.31.1.1.0.-->
          <slot c-id="29.2.2.0" class="sc-nested-cmp-parent" s-sn=""></slot>
        </div>
      </nested-scope-cmp>
    </div>
  </template>
  <!--r.29-->
  <nested-cmp-child class="sc-nested-cmp-child-h" custom-hydrate-flag="" s-id="30">
    <template shadowrootmode="open">
      <style sty-id="sc-nested-cmp-child">
        :host{display:block}
      </style>
      <div c-id="30.0.0.0" class="sc-nested-cmp-child some-other-class">
        <slot c-id="30.1.1.0" class="sc-nested-cmp-child"></slot>
      </div>
    </template>
    <!--r.30-->
    Hello World
  </nested-cmp-child>
</nested-cmp-parent>`);
  });

  test('renders server-side components with delegated focus', async ({ page }) => {
    const { html } = await renderToString('<cmp-dsd-focus></cmp-dsd-focus>', {
      serializeShadowRoot: true,
      fullDocument: false,
    });

    expect(html).toContain('<template shadowrootmode="open" shadowrootdelegatesfocus>');
    expect(html).toMatchSnapshot();

    await page.setContent(html);

    const div = page.locator('cmp-dsd-focus').locator('div');
    await div.click();

    const activeElement = await page.evaluate(() => document.activeElement?.outerHTML ?? '');
    expect(activeElement).toContain('cmp-dsd-focus');
  });

  test("renders the styles of serializeShadowRoot `scoped` components when they're embedded in a shadow root", async ({
    page,
  }) => {
    const { html } = await renderToString(
      `
      <div>
        <wrap-ssr-shadow-cmp>Inside shadowroot</wrap-ssr-shadow-cmp>
        <ssr-shadow-cmp>Outside shadowroot</ssr-shadow-cmp>
      </div>`,
      {
        fullDocument: false,
        serializeShadowRoot: {
          default: 'declarative-shadow-dom',
          scoped: ['ssr-shadow-cmp'],
        },
      },
    );

    await page.setContent(html);

    const wrapCmp = page.locator('wrap-ssr-shadow-cmp');
    const scopedCmp = page.locator('ssr-shadow-cmp').first();
    const scopedNestCmp = page.locator('wrap-ssr-shadow-cmp').locator('ssr-shadow-cmp');

    const wrapCmpStyles = await wrapCmp.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, backgroundColor: cs.backgroundColor };
    });
    const scopedCmpStyles = await scopedCmp.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, backgroundColor: cs.backgroundColor };
    });
    const scopedNestCmpStyles = await scopedNestCmp.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, backgroundColor: cs.backgroundColor };
    });

    expect(wrapCmpStyles.color).toBe('rgb(255, 255, 255)'); // white
    expect(wrapCmpStyles.backgroundColor).toBe('rgb(0, 0, 255)'); // blue
    expect(scopedCmpStyles.color).toBe('rgb(255, 0, 0)'); // red
    expect(scopedCmpStyles.backgroundColor).toBe('rgb(255, 255, 0)'); // yellow
    expect(scopedNestCmpStyles.color).toBe('rgb(255, 0, 0)'); // red
    expect(scopedNestCmpStyles.backgroundColor).toBe('rgb(255, 255, 0)'); // yellow
  });

  test.describe('hydrateDocument', () => {
    test('can hydrate components with open shadow dom by default', async () => {
      const template = `<another-car-detail></another-car-detail>`;
      const fullHTML = `<html><head></head><body>${template}</body></html>`;
      const win = createWindowFromHtml(fullHTML, Math.random().toString());
      const document = win.document;
      await hydrateDocument(document);
      const html = document.documentElement.outerHTML;

      expect(html).toContain('shadowrootmode="open"');
    });

    test('can hydrate components with scoped shadow dom', async () => {
      const template = `<another-car-detail></another-car-detail>`;
      const fullHTML = `<html><head></head><body>${template}</body></html>`;
      const win = createWindowFromHtml(fullHTML, Math.random().toString());
      const document = win.document;
      await hydrateDocument(document, {
        serializeShadowRoot: 'scoped',
      });
      const html = document.documentElement.outerHTML;

      expect(html).not.toContain('shadowrootmode="open"');
      expect(html).toContain('sc-');
    });
  });
});
