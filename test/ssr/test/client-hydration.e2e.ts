import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

import { CarData } from '../src/components/car-list/car-data';

const vento = new CarData('VW', 'Vento', 2024);
const beetle = new CarData('VW', 'Beetle', 2023);

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../dist/ssr/index.js');
let renderToString: HydrateModule['renderToString'];
let resetSsrDocData: HydrateModule['resetSsrDocData'];

test.describe('client hydration', () => {
  test.beforeEach(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../dist/ssr/index.js');
    renderToString = mod.renderToString;
    resetSsrDocData = mod.resetSsrDocData;
    resetSsrDocData();
  });

  test.describe('browser takeover', () => {
    test('can take over a server side rendered component and re-render it in the browser', async ({
      page,
    }) => {
      const { html } = await renderToString('<cmp-dsd></cmp-dsd>', {
        serializeShadowRoot: true,
        fullDocument: false,
      });

      expect(html || '').toContain('Count me: 0!');
      await page.setContent(html || '');

      const button = await page.locator('cmp-dsd').locator('button');
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

      expect(html || '').toContain('Count me: 42!');
      await page.setContent(html || '');

      const button = page.locator('cmp-dsd').locator('button');
      await button.click();
      await expect(button).toHaveText('Count me: 43!');
    });

    test('can render server side component when client sender renders differently', async ({
      page,
    }) => {
      const { html } = await renderToString('<cmp-server-vs-client></cmp-server-vs-client>', {
        serializeShadowRoot: true,
        fullDocument: false,
      });

      expect(html || '').toContain('Server vs Client? Winner: Server');
      await page.setContent(html || '');

      const div = page.locator('cmp-server-vs-client').locator('div');
      await expect(div).toHaveText('Server vs Client? Winner: Client');
    });

    test('correctly renders a slow to hydrate component with a prop', async ({ page }) => {
      const { html } = await renderToString(`<slow-ssr-prop></slow-ssr-prop>`, {
        fullDocument: true,
        serializeShadowRoot: 'declarative-shadow-dom',
        beforeSsr: (doc) => {
          const slowCmp = doc.querySelector('slow-ssr-prop') as any;
          slowCmp.anArray = ['one', 'two', 'three'];
        },
      });

      await page.setContent(html || '');
      await page.waitForSelector('slow-ssr-prop[custom-hydrate-flag]');

      // Update the prop after hydration
      await page.evaluate(() => {
        const slowCmp = document.querySelector('slow-ssr-prop') as any;
        slowCmp.anArray = ['one', 'two', 'three', 'four'];
      });

      // Wait for re-render
      await page.waitForFunction(() => {
        const slowCmp = document.querySelector('slow-ssr-prop');
        return slowCmp?.shadowRoot?.querySelector('div')?.textContent?.includes('four');
      });

      const text = await page.evaluate(() => {
        const slowCmp = document.querySelector('slow-ssr-prop');
        return slowCmp?.shadowRoot?.querySelector('div')?.textContent;
      });

      expect(text).toBe('An array component:onetwothreefour');
    });
  });

  test.describe('event listeners', () => {
    test('can hydrate components with event listeners', async ({ page }) => {
      const { html } = await renderToString(
        `
        <dsd-listen-cmp>Hello World</dsd-listen-cmp>
        <car-list cars=${JSON.stringify([vento, beetle])}></car-list>
      `,
        {
          serializeShadowRoot: true,
          fullDocument: true,
          clientHydrateAnnotations: false,
        },
      );

      /**
       * renders the component with listener with proper vdom annotation
       */
      expect(html || '').toContain(
        `<dsd-listen-cmp class="sc-dsd-listen-cmp-h" custom-hydrate-flag=""><template shadowrootmode="open"><style sty-id="sc-dsd-listen-cmp">:host{display:block}</style><slot class="sc-dsd-listen-cmp"></slot></template><!---->Hello World</dsd-listen-cmp>`,
      );

      /**
       * renders second component with proper vdom annotation
       */
      expect(html || '').toContain(
        `<car-detail class="sc-car-list" custom-hydrate-flag=""><!----><section>2023 VW Beetle</section></car-detail>`,
      );

      await page.setContent(html || '');

      const cars = page.locator('car-detail');
      const carTexts = await cars.allTextContents();
      expect(carTexts).toContain('2024 VW Vento');
      expect(carTexts).toContain('2023 VW Beetle');
    });
  });

  test.describe('lifecycle hooks', () => {
    test('calls beforeSsr and afterSsr function hooks', async () => {
      let beforeSsrCalled = 0;
      let afterSsrCalled = 0;

      const beforeSsr = (doc: Document) => {
        beforeSsrCalled++;
        const div = doc.querySelector('div');
        if (div) div.textContent = 'Hello Universe';
      };
      const afterSsr = () => {
        afterSsrCalled++;
      };

      const { html } = await renderToString('<div>Hello World</div>', {
        beforeSsr,
        afterSsr,
      });

      expect(beforeSsrCalled).toBe(1);
      expect(afterSsrCalled).toBe(1);
      expect(html || '').toContain('<body><div>Hello Universe</div></body>');
    });
  });

  test.describe('delegated focus', () => {
    test('renders server-side components with delegated focus', async ({ page }) => {
      const { html } = await renderToString('<cmp-dsd-focus></cmp-dsd-focus>', {
        serializeShadowRoot: true,
        fullDocument: false,
      });

      expect(html || '').toContain('<template shadowrootmode="open" shadowrootdelegatesfocus>');
      expect(html || '').toMatchSnapshot();

      await page.setContent(html || '');

      const div = page.locator('cmp-dsd-focus').locator('div');
      await div.click();

      const activeElement = await page.evaluate(() => document.activeElement?.outerHTML ?? '');
      expect(activeElement).toContain('cmp-dsd-focus');
    });
  });

  test.describe('shadow root rendering', () => {
    test('does not render a shadow component if serializeShadowRoot is false', async () => {
      const { html } = await renderToString('<another-car-detail></another-car-detail>', {
        serializeShadowRoot: false,
        fullDocument: false,
        clientHydrateAnnotations: false,
      });
      expect(html || '').toBe(
        '<another-car-detail class="sc-another-car-detail-h" custom-hydrate-flag=""><!----></another-car-detail>',
      );
    });

    test('does not render a shadow component but its light dom', async () => {
      const { html } = await renderToString('<cmp-with-slot>Hello World</cmp-with-slot>', {
        serializeShadowRoot: false,
        fullDocument: false,
        clientHydrateAnnotations: false,
      });
      expect(html || '').toBe(
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
      expect(html || '')
        .toBe(`<nested-cmp-parent class="sc-nested-cmp-parent-h" custom-hydrate-flag="" s-id="1">
  <template shadowrootmode="open">
    <style sty-id="sc-nested-cmp-parent">
      .sc-nested-scope-cmp-h{color:green}slot-fb{display:contents}slot-fb[hidden]{display:none}:host{display:inline-block}
    </style>
    <div c-id="1.0.0.0" class="sc-nested-cmp-parent some-class">
      <nested-scope-cmp c-id="1.1.1.0" class="sc-nested-cmp-parent sc-nested-scope-cmp-h" custom-hydrate-flag="" s-id="3">
        <!--r.3-->
        <!--o.1.2.c-->
        <div c-id="3.0.0.0" class="sc-nested-scope-cmp sc-nested-scope-cmp-s some-scope-class">
          <!--s.3.1.1.0.-->
          <slot c-id="1.2.2.0" class="sc-nested-cmp-parent" s-sn=""></slot>
        </div>
      </nested-scope-cmp>
    </div>
  </template>
  <!--r.1-->
  <nested-cmp-child class="sc-nested-cmp-child-h" custom-hydrate-flag="" s-id="2">
    <template shadowrootmode="open">
      <style sty-id="sc-nested-cmp-child">
        :host{display:block}
      </style>
      <div c-id="2.0.0.0" class="sc-nested-cmp-child some-other-class">
        <slot c-id="2.1.1.0" class="sc-nested-cmp-child"></slot>
      </div>
    </template>
    <!--r.2-->
    Hello World
  </nested-cmp-child>
</nested-cmp-parent>`);
    });
  });

  test.describe('closed shadow DOM hydration', () => {
    test('can hydrate a component with closed shadow DOM', async ({ page }) => {
      const { html } = await renderToString('<shadow-closed></shadow-closed>', {
        serializeShadowRoot: true,
        fullDocument: false,
      });

      expect(html || '').toContain('Closed Shadow DOM Content');
      await page.setContent(html || '');

      // After hydration, shadowRoot should still be null (closed mode)
      const shadowRootIsNull = await page.evaluate(() => {
        const el = document.querySelector('shadow-closed');
        return el?.shadowRoot === null;
      });
      expect(shadowRootIsNull).toBe(true);
    });

    test('closed shadow DOM component renders content after hydration', async ({ page }) => {
      const { html } = await renderToString('<shadow-closed></shadow-closed>', {
        serializeShadowRoot: true,
        fullDocument: false,
      });

      await page.setContent(html || '');

      // The component should still be visible and styled even though shadowRoot is closed
      const isVisible = await page.evaluate(() => {
        const el = document.querySelector('shadow-closed');
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      expect(isVisible).toBe(true);
    });

    test('closed shadow DOM preserves slotted content after hydration', async ({ page }) => {
      const { html } = await renderToString(
        '<shadow-closed><span id="slotted">Slotted Text</span></shadow-closed>',
        {
          serializeShadowRoot: true,
          fullDocument: false,
        },
      );

      await page.setContent(html || '');

      // Slotted content should be accessible in light DOM
      const slottedText = await page.evaluate(() => {
        const el = document.querySelector('shadow-closed #slotted');
        return el?.textContent;
      });
      expect(slottedText).toBe('Slotted Text');
    });
  });
});
