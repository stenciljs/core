import { Readable } from 'node:stream';

import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

import { CarData } from '../src/components/car-list/car-data';

const vento = new CarData('VW', 'Vento', 2024);
const beetle = new CarData('VW', 'Beetle', 2023);

async function readableToString(readable: Readable) {
  return new Promise((resolve, reject) => {
    let data = '';
    readable.on('data', (chunk) => (data += chunk));
    readable.on('end', () => resolve(data));
    readable.on('error', (err) => reject(err));
  });
}

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../hydrate/index');
let renderToString: HydrateModule['renderToString'];
let streamToString: HydrateModule['streamToString'];
let resetHydrateDocData: HydrateModule['resetHydrateDocData'];

test.describe('renderToString API', () => {
  test.beforeEach(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../hydrate/index.mjs');
    renderToString = mod.renderToString;
    streamToString = mod.streamToString;
    resetHydrateDocData = mod.resetHydrateDocData;
    resetHydrateDocData();
  });

  test('resolves to a Promise<HydrateResults> by default', async () => {
    const renderedString = renderToString('<div>Hello World</div>');
    expect(typeof renderedString.then).toBe('function');
    renderedString.then((result) => result.html);
  });

  test('can render a simple dom node', async () => {
    const { html } = await renderToString('<div>Hello World</div>');
    expect(html).toContain('<body><div>Hello World</div></body>');
  });

  test('can render a simple dom node (stream)', async () => {
    const input = '<div>Hello World</div>';
    const renderedHTML = '<body><div>Hello World</div></body>';
    expect(await readableToString(streamToString(input))).toContain(renderedHTML);
  });

  test('only returns the element if we render to DSD with fullDocument: false', async () => {
    const { html } = await renderToString('<div>Hello World</div>', {
      serializeShadowRoot: true,
      fullDocument: false,
    });
    expect(html).toBe('<div>Hello World</div>');
  });

  test('can render a simple shadow component', async () => {
    const { html } = await renderToString('<another-car-detail></another-car-detail>', {
      serializeShadowRoot: true,
      fullDocument: false,
      prettyHtml: true,
      clientHydrateAnnotations: false,
    });
    expect(html).toMatchSnapshot();
  });

  test('can render nested components', async () => {
    const { html } = await renderToString(
      `<another-car-list cars='${JSON.stringify([vento, beetle])}'></another-car-list>`,
      {
        serializeShadowRoot: true,
        fullDocument: false,
        prettyHtml: true,
        clientHydrateAnnotations: false,
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
      clientHydrateAnnotations: false,
    });
    expect(html).toMatchSnapshot();
    expect(html).toContain(
      `<car-detail class="sc-car-list" custom-hydrate-flag=""><!----><section>2024 VW Vento</section></car-detail>`,
    );
  });

  test('can render a scoped component within a shadow component (stream)', async () => {
    const input = `<car-list cars=${JSON.stringify([vento, beetle])}></car-list>`;
    const opts = {
      serializeShadowRoot: true,
      fullDocument: false,
      clientHydrateAnnotations: false,
    };

    const result = await readableToString(streamToString(input, opts));
    expect(result).toContain(
      '<car-detail class="sc-car-list" custom-hydrate-flag=""><!----><section>2024 VW Vento</section></car-detail>',
    );
  });

  test('does not render a shadow component if serializeShadowRoot is false', async () => {
    const { html } = await renderToString('<another-car-detail></another-car-detail>', {
      serializeShadowRoot: false,
      fullDocument: false,
      clientHydrateAnnotations: false,
    });
    expect(html).toBe(
      '<another-car-detail class="sc-another-car-detail-h" custom-hydrate-flag=""><!----></another-car-detail>',
    );
  });

  test('does not render a shadow component but its light dom', async () => {
    const { html } = await renderToString('<cmp-with-slot>Hello World</cmp-with-slot>', {
      serializeShadowRoot: false,
      fullDocument: false,
      clientHydrateAnnotations: false,
    });
    expect(html).toBe(
      '<cmp-with-slot class="sc-cmp-with-slot-h" custom-hydrate-flag=""><!---->Hello World</cmp-with-slot>',
    );
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
    expect(html).toMatchSnapshot();
  });

  test('checks perf when loading lots of the same component', async () => {
    const startDsd = performance.now();

    await renderToString(
      Array(50)
        .fill(0)
        .map((_, i) => `<ssr-shadow-cmp>Value ${i}</ssr-shadow-cmp>`)
        .join(''),
      {
        fullDocument: true,
        serializeShadowRoot: 'declarative-shadow-dom',
        constrainTimeouts: false,
      },
    );

    const dsdRenderTime = performance.now() - startDsd;
    expect(dsdRenderTime).toBeLessThan(500);

    const startScoped = performance.now();

    await renderToString(
      Array(50)
        .fill(0)
        .map((_, i) => `<ssr-shadow-cmp>Value ${i}</ssr-shadow-cmp>`)
        .join(''),
      {
        fullDocument: true,
        serializeShadowRoot: 'scoped',
        constrainTimeouts: false,
      },
    );

    const scopedRenderTime = performance.now() - startScoped;
    expect(scopedRenderTime).toBeLessThan(500);
  });
});
