import { Readable } from 'node:stream';

import { newE2EPage } from '@stencil/core/testing';

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

describe('renderToString', () => {
  beforeAll(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../../hydrate');
    renderToString = mod.renderToString;
    streamToString = mod.streamToString;
    hydrateDocument = mod.hydrateDocument;
    createWindowFromHtml = mod.createWindowFromHtml;
  });

  it('resolves to a Promise<HydrateResults> by default', async () => {
    const renderedString = renderToString('<div>Hello World</div>');
    expect(typeof renderedString.then).toBe('function');
    // this is a type assertion to verify that the promise resolves to a HydrateResults object
    renderedString.then((result) => result.html);

    const renderedDocument = hydrateDocument('<div>Hello World</div>');
    expect(typeof renderedDocument.then).toBe('function');
    // this is a type assertion to verify that the promise resolves to a HydrateResults object
    renderedDocument.then((result) => result.html);
  });

  it('can render a simple dom node', async () => {
    const { html } = await renderToString('<div>Hello World</div>');
    expect(html).toContain('<body><div>Hello World</div></body>');
  });

  it('can render a simple dom node (sync)', async () => {
    const input = '<div>Hello World</div>';
    const renderedHTML = '<body><div>Hello World</div></body>';
    const stream = renderToString(input, {}, true);
    expect(await readableToString(stream)).toContain(renderedHTML);
    expect(await readableToString(streamToString(input))).toContain(renderedHTML);
  });

  it('can render a simple shadow component', async () => {
    const { html } = await renderToString('<another-car-detail></another-car-detail>', {
      serializeShadowRoot: true,
      fullDocument: false,
      prettyHtml: true,
    });
    expect(html).toMatchSnapshot();
  });

  it.skip('supports passing props to components', async () => {
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

  it.skip('supports passing props to components with a simple object', async () => {
    const { html } = await renderToString(`<another-car-detail car=${JSON.stringify(vento)}></another-car-detail>`, {
      serializeShadowRoot: true,
      fullDocument: false,
      prettyHtml: true,
    });
    expect(html).toMatchSnapshot();
    expect(html).toContain('2024 VW Vento');
  });

  it.skip('does not fail if provided object is not a valid JSON', async () => {
    const { html } = await renderToString(
      `<another-car-detail car='{"year":2024, "make": "VW", "model": "Vento"'></another-car-detail>`,
      {
        serializeShadowRoot: true,
        fullDocument: false,
      },
    );
    expect(html).toContain('<section class="sc-another-car-detail" c-id="4.0.0.0"><!--t.4.1.1.0--> </section>');
  });

  it('supports styles for DSD', async () => {
    const { html } = await renderToString('<another-car-detail></another-car-detail>', {
      serializeShadowRoot: true,
      fullDocument: false,
    });
    expect(html).toContain('<template shadowrootmode="open"><style>section{color:green}</style>');
  });

  it('only returns the element if we render to DSD', async () => {
    const { html } = await renderToString('<div>Hello World</div>', {
      serializeShadowRoot: true,
      fullDocument: false,
    });
    expect(html).toBe('<div>Hello World</div>');
  });

  it.skip('can render nested components', async () => {
    const { html } = await renderToString(
      `<another-car-list cars=${JSON.stringify([vento, beetle])}></another-car-list>`,
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

  it.skip('can render a scoped component within a shadow component', async () => {
    const { html } = await renderToString(`<car-list cars=${JSON.stringify([vento, beetle])}></car-list>`, {
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

  it.skip('can render a scoped component within a shadow component (sync)', async () => {
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

  it('can take over a server side rendered component and re-render it in the browser', async () => {
    const { html } = await renderToString('<cmp-dsd></cmp-dsd>', {
      serializeShadowRoot: true,
      fullDocument: false,
    });

    expect(html).toContain('Count me: 0!');
    const page = await newE2EPage({ html, url: 'https://stencil.com' });
    const button = await page.find('cmp-dsd >>> button');
    await button.click();
    expect(button).toEqualText('Count me: 1!');
  });

  it('can take over a server side rendered component and re-render it in the browser with applied prop', async () => {
    const { html } = await renderToString('<cmp-dsd initial-counter="42"></cmp-dsd>', {
      serializeShadowRoot: true,
      fullDocument: false,
    });

    expect(html).toContain('Count me: 42!');
    const page = await newE2EPage({ html, url: 'https://stencil.com' });
    const button = await page.find('cmp-dsd >>> button');
    await button.click();
    expect(button).toEqualText('Count me: 43!');
  });

  it('can render server side component when client sender renders differently', async () => {
    const { html } = await renderToString('<cmp-server-vs-client></cmp-server-vs-client>', {
      serializeShadowRoot: true,
      fullDocument: false,
    });

    expect(html).toContain('Server vs Client? Winner: Server');
    const page = await newE2EPage({ html, url: 'https://stencil.com' });
    const button = await page.find('cmp-server-vs-client');
    expect(button.shadowRoot.querySelector('div')).toEqualText('Server vs Client? Winner: Client');
  });

  it.skip('can hydrate components with event listeners', async () => {
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
     * renders the component with listener with proper vdom annotation, e.g.
     * ```html
     * <dsd-listen-cmp custom-hydrate-flag="" s-id="1">
     *   <template shadowrootmode="open">
     *     <style sty-id="sc-dsd-listen-cmp">
     *       .sc-dsd-listen-cmp-h{display:block}
     *     </style>
     *     <slot c-id="1.0.0.0"></slot>
     *   </template>
     *   <!--r.1-->
     *   Hello World
     * </dsd-listen-cmp>
     * ```
     */
    expect(html).toContain(
      `<dsd-listen-cmp class=\"sc-dsd-listen-cmp-h\" custom-hydrate-flag=\"\" s-id=\"21\"><template shadowrootmode=\"open\"><style>:host{display:block}</style><slot class=\"sc-dsd-listen-cmp\" c-id=\"21.0.0.0\"></slot></template><!--r.21-->Hello World</dsd-listen-cmp>`,
    );

    /**
     * renders second component with proper vdom annotation, e.g.:
     * ```html
     * <car-detail c-id="2.4.2.0" class="sc-car-list" custom-hydrate-flag="" s-id="4">
     *   <!--r.4-->
     *   <section c-id="4.0.0.0" class="sc-car-list">
     *     <!--t.4.1.1.0-->
     *     2023 VW Beetle
     *   </section>
     * </car-detail>
     */
    expect(html).toContain(
      `<car-detail class=\"sc-car-list\" custom-hydrate-flag=\"\" c-id=\"22.4.2.0\" s-id=\"24\"><!--r.24--><section c-id=\"24.0.0.0\"><!--t.24.1.1.0-->2023 VW Beetle</section></car-detail>`,
    );

    const page = await newE2EPage({ html, url: 'https://stencil.com' });
    const cars = await page.findAll('>>>car-detail');
    expect(cars.map((car) => car.textContent)).toEqual(['2024 VW Vento', '2023 VW Beetle']);
  });

  it('calls beforeHydrate and afterHydrate function hooks', async () => {
    const beforeHydrate = jest.fn((doc) => (doc.querySelector('div').textContent = 'Hello Universe'));
    const afterHydrate = jest.fn();

    const { html } = await renderToString('<div>Hello World</div>', {
      beforeHydrate,
      afterHydrate,
    });

    expect(beforeHydrate).toHaveBeenCalledTimes(1);
    expect(afterHydrate).toHaveBeenCalledTimes(1);
    expect(html).toContain('<body><div>Hello Universe</div></body>');
  });

  it.skip('does not render a shadow component if serializeShadowRoot is false', async () => {
    const { html } = await renderToString('<another-car-detail></another-car-detail>', {
      serializeShadowRoot: false,
      fullDocument: false,
    });
    expect(html).toBe(
      '<another-car-detail class="sc-another-car-detail-h" custom-hydrate-flag="" s-id="25"><!--r.25--></another-car-detail>',
    );
  });

  it.skip('does not render a shadow component but its light dom', async () => {
    const { html } = await renderToString('<cmp-with-slot>Hello World</cmp-with-slot>', {
      serializeShadowRoot: false,
      fullDocument: false,
    });
    expect(html).toBe(
      '<cmp-with-slot class="sc-cmp-with-slot-h" custom-hydrate-flag="" s-id="26"><!--r.26-->Hello World</cmp-with-slot>',
    );
  });

  describe('modes in declarative shadow dom', () => {
    it('renders components in ios mode', async () => {
      const { html } = await renderToString('<prop-cmp first="Max" last="Mustermann"></prop-cmp>', {
        fullDocument: false,
        prettyHtml: true,
        modes: [() => 'ios'],
      });
      expect(html).toContain('<style>');
      expect(html).toContain(';color:white;');
      const page = await newE2EPage({ html, url: 'https://stencil.com' });
      const div = await page.find('>>>div');
      const { color } = await div.getComputedStyle();
      expect(color).toBe('rgb(255, 255, 255)');
    });

    it('renders components in md mode', async () => {
      const { html } = await renderToString('<prop-cmp first="Max" last="Mustermann"></prop-cmp>', {
        fullDocument: false,
        prettyHtml: true,
        modes: [() => 'md'],
      });
      expect(html).toContain(';color:black;');
      const page = await newE2EPage({ html, url: 'https://stencil.com' });
      const div = await page.find('>>>div');
      const { color } = await div.getComputedStyle();
      expect(color).toBe('rgb(0, 0, 0)');
    });
  });

  it.skip('does not render the shadow root twice', async () => {
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
    <style>
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
      <style>
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

  it.skip('renders server-side components with delegated focus', async () => {
    const { html } = await renderToString('<cmp-dsd-focus></cmp-dsd-focus>', {
      serializeShadowRoot: true,
      fullDocument: false,
    });

    expect(html).toContain('<template shadowrootmode="open" shadowrootdelegatesfocus>');
    expect(html).toMatchSnapshot();

    const page = await newE2EPage({ html, url: 'https://stencil.com' });
    const div = await page.find('cmp-dsd-focus >>> div');
    await div.click();

    expect(await page.evaluate(() => document.activeElement.outerHTML)).toContain('cmp-dsd-focus');
  });

  describe('hydrateDocument', () => {
    it('can hydrate components with open shadow dom by default', async () => {
      const template = `<another-car-detail></another-car-detail>`;
      const fullHTML = `<html><head></head><body>${template}</body></html>`;
      const win = createWindowFromHtml(fullHTML, Math.random().toString());
      const document = win.document;
      await hydrateDocument(document);
      const html = document.documentElement.outerHTML;

      expect(html).toContain('shadowrootmode="open"');
    });

    it('can hydrate components with scoped shadow dom', async () => {
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
