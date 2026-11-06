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
          clientSsrAnnotations: false,
        },
      );

      /**
       * renders the component with listener with proper vdom annotation
       */
      expect(html || '').toContain(
        `<dsd-listen-cmp custom-hydrate-flag=""><template shadowrootmode="open"><style sty-id="sc-dsd-listen-cmp">:host{display:block}</style><slot></slot></template><!---->Hello World</dsd-listen-cmp>`,
      );

      /**
       * renders second component with proper vdom annotation
       */
      expect(html || '').toContain(
        `<car-detail custom-hydrate-flag=""><!----><section>2023 VW Beetle</section></car-detail>`,
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

    test('beforeSsr can modify component props before hydration', async ({ page }) => {
      const { html } = await renderToString(`<car-list></car-list>`, {
        serializeShadowRoot: true,
        fullDocument: false,
        clientSsrAnnotations: false,
        beforeSsr(document) {
          document.querySelector('car-list').cars = [vento, beetle];
        },
      });

      expect(html ?? '').toContain('>2023 VW Beetle<');
      expect(html ?? '').toContain('>2024 VW Vento<');

      await page.setContent(html ?? '');

      const cars = page.locator('car-detail');
      const carTexts = await cars.allTextContents();
      expect(carTexts).toContain('2024 VW Vento');
      expect(carTexts).toContain('2023 VW Beetle');
    });

    test('afterSsr can modify component attributes for after hydration', async ({ page }) => {
      const { html } = await renderToString(`<car-list></car-list>`, {
        serializeShadowRoot: true,
        fullDocument: false,
        clientSsrAnnotations: false,
        afterSsr(document) {
          document.querySelector('car-list').setAttribute('cars', JSON.stringify([vento, beetle]));
        },
      });

      expect(html ?? '').toContain(
        `cars="[{&quot;make&quot;:&quot;VW&quot;,&quot;model&quot;:&quot;Vento&quot;,&quot;year&quot;:2024},{&quot;make&quot;:&quot;VW&quot;,&quot;model&quot;:&quot;Beetle&quot;,&quot;year&quot;:2023}]"`,
      );
      await page.setContent(html ?? '');

      const cars = page.locator('car-detail');
      const carTexts = await cars.allTextContents();
      expect(carTexts).toContain('2024 VW Vento');
      expect(carTexts).toContain('2023 VW Beetle');
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
        clientSsrAnnotations: false,
      });
      expect(html || '').toBe(
        '<another-car-detail custom-hydrate-flag=""><!----></another-car-detail>',
      );
    });

    test('does not render a shadow component but its light dom', async () => {
      const { html } = await renderToString('<cmp-with-slot>Hello World</cmp-with-slot>', {
        serializeShadowRoot: false,
        fullDocument: false,
        clientSsrAnnotations: false,
      });
      expect(html || '').toBe(
        '<cmp-with-slot custom-hydrate-flag=""><!---->Hello World</cmp-with-slot>',
      );
    });

    test('does not render the shadow root twice', async () => {
      const { html } = await renderToString(
        `
        <nested-cmp-parent>
          <nested-child-cmp custom-hydrate-flag="" s-id="3">
            <template shadowrootmode="open">
              <div c-id="3.0.0.0" class="some-other-class">
                <slot c-id="3.1.1.0"></slot>
              </div>
            </template>
            <!--r.3-->
            Hello World
          </nested-child-cmp>
        </nested-cmp-parent>
      `,
        {
          fullDocument: false,
          prettyHtml: true,
        },
      );
      expect(html || '').toBe(`<nested-cmp-parent custom-hydrate-flag="" s-id="1">
  <template shadowrootmode="open">
    <style sty-id="sc-nested-cmp-parent">
      .sc-nested-scope-cmp-h{color:green}slot-fb{display:contents}slot-fb[hidden]{display:none}:host{display:inline-block}
    </style>
    <div c-id="1.0.0.0" class="some-class">
      <nested-scope-cmp c-id="1.1.1.0" class="sc-nested-scope-cmp-h" custom-hydrate-flag="" s-id="3">
        <!--r.3-->
        <!--o.1.2.c-->
        <div c-id="3.0.0.0" class="sc-nested-scope-cmp sc-nested-scope-cmp-s some-scope-class">
          <!--s.3.1.1.0.-->
          <slot c-id="1.2.2.0" s-sn=""></slot>
        </div>
      </nested-scope-cmp>
    </div>
  </template>
  <!--r.1-->
  <nested-child-cmp custom-hydrate-flag="" s-id="2">
    <template shadowrootmode="open">
      <style sty-id="sc-nested-child-cmp">
        :host{display:block}
      </style>
      <div c-id="2.0.0.0" class="some-other-class">
        <slot c-id="2.1.1.0"></slot>
      </div>
    </template>
    <!--r.2-->
    Hello World
  </nested-child-cmp>
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

  test.describe('child hydrating before its parent', () => {
    test('waits for the parent to render, and keeps the classes the child sets on its own host', async ({
      page,
    }) => {
      const { html } = await renderToString('<ssr-class-parent-cmp></ssr-class-parent-cmp>', {
        fullDocument: true,
        serializeShadowRoot: 'declarative-shadow-dom',
      });

      // standalone build (not `setContent`'s lazy loader) so the child can be defined first
      // and hydrate + render before its parent
      const body = (html || '').replace(
        '</body>',
        `<script type="module">
          import { defineCustomElement as defineChild } from '/standalone/ssr-class-child-cmp.js';
          import { defineCustomElement as defineParent } from '/standalone/ssr-class-parent-cmp.js';
          defineChild();
          defineParent();
        </script></body>`,
      );
      await page.route('**/ssr-class-hydration', (route) =>
        route.fulfill({ status: 200, contentType: 'text/html', body }),
      );
      await page.goto('/ssr-class-hydration');

      const classes = await page.evaluate(async () => {
        await customElements.whenDefined('ssr-class-parent-cmp');
        const parent = document.querySelector('ssr-class-parent-cmp') as HTMLElement & {
          componentOnReady(): Promise<unknown>;
        };
        await parent.componentOnReady();
        const child = (id: string) =>
          parent.shadowRoot?.querySelector(id) as HTMLElement & { initialDisabled?: boolean };
        const sorted = (id: string) => Array.from(child(id)?.classList ?? []).sort();
        return {
          initialDisabled: [
            child('#with-class')?.initialDisabled,
            child('#without-class')?.initialDisabled,
          ],
          withClass: sorted('#with-class'),
          withoutClass: sorted('#without-class'),
        };
      });
      // children wait for the SSR parent to render (and pass `disabled`) before their first render
      expect(classes.initialDisabled).toEqual([true, true]);
      expect(classes.withClass).toEqual(['child-disabled', 'child-own', 'parent-set']);
      expect(classes.withoutClass).toEqual(['child-disabled', 'child-own']);
    });
  });
  /**
   * Slotted content of components that don't render into a native shadow root (scoped, or no
   * encapsulation) has to be moved into place on every client render, independently of what
   * other components on the page have rendered. Each page below holds only the components under
   * test, so no other render can mask a missed relocation.
   */
  test.describe('slot relocation after hydration', () => {
    /** Wait for every Stencil component on the page, including those inside shadow roots. */
    const waitForComponents = async (page: import('@playwright/test').Page, tags: string[]) => {
      const collect = `(root, tags) => [...root.querySelectorAll('*')].flatMap((el) => [
        ...(tags.includes(el.localName) ? [el] : []),
        ...(el.shadowRoot ? collect(el.shadowRoot, tags) : []),
      ])`;
      await page.waitForFunction(
        ({ tags, collect }) => {
          const fn = new Function(`const collect = ${collect}; return collect;`)();
          const found = fn(document, tags);
          return (
            found.length > 0 && found.every((el: any) => typeof el.componentOnReady === 'function')
          );
        },
        { tags, collect },
      );
      await page.evaluate(
        ({ tags, collect }) => {
          const fn = new Function(`const collect = ${collect}; return collect;`)();
          return Promise.all(fn(document, tags).map((el: any) => el.componentOnReady()));
        },
        { tags, collect },
      );
    };

    const PARENT_TAGS = ['shadow-text-parent-cmp', 'scoped-ssr-child-cmp', 'plain-slot-cmp'];
    const slotted = (page: import('@playwright/test').Page) =>
      page.evaluate(() => {
        const root = document.querySelector('shadow-text-parent-cmp')!.shadowRoot!;
        const scoped = root.querySelector('scoped-ssr-child-cmp')!;
        const plain = root.querySelector('plain-slot-cmp')!;
        return {
          scoped: scoped.querySelector('div')!.textContent,
          scopedChildren: scoped.querySelectorAll('div').length,
          plain: plain.querySelector('p.plain-slot')!.textContent,
          plainParagraphs: plain.querySelectorAll('p').length,
        };
      });

    test('keeps text a shadow component slots into scoped and unencapsulated children', async ({
      page,
    }) => {
      const { html } = await renderToString('<shadow-text-parent-cmp></shadow-text-parent-cmp>', {
        fullDocument: true,
        serializeShadowRoot: 'declarative-shadow-dom',
      });
      expect(html || '').toContain('slotted text');

      await page.setContent(html || '');
      await waitForComponents(page, PARENT_TAGS);

      expect(await slotted(page)).toEqual({
        scoped: 'slotted text',
        scopedChildren: 1,
        plain: 'slotted text',
        plainParagraphs: 1,
      });
    });

    test('moves updated slotted text into place on later renders', async ({ page }) => {
      const { html } = await renderToString('<shadow-text-parent-cmp></shadow-text-parent-cmp>', {
        fullDocument: true,
        serializeShadowRoot: 'declarative-shadow-dom',
      });
      await page.setContent(html || '');
      await waitForComponents(page, PARENT_TAGS);

      for (const text of ['second', 'third']) {
        await page.evaluate((t) => {
          (document.querySelector('shadow-text-parent-cmp') as any).text = t;
        }, text);
        await expect
          .poll(() => slotted(page))
          .toEqual({ scoped: text, scopedChildren: 1, plain: text, plainParagraphs: 1 });
      }
    });

    test('relocates slotted text on the server when a shadow parent is rendered as scoped', async () => {
      // `serializeShadowRoot: 'scoped'` renders shadow components without a shadow root on the
      // server, so their slotted content has to be relocated there too.
      const { html } = await renderToString('<shadow-text-parent-cmp></shadow-text-parent-cmp>', {
        fullDocument: false,
        serializeShadowRoot: 'scoped',
      });
      expect(html || '').toMatch(
        /<scoped-ssr-child-cmp[^>]*>(?:(?!<\/scoped-ssr-child-cmp>)[\s\S])*<div[^>]*>(?:<!--[^>]*-->)*slotted text<\/div>/,
      );
      expect(html || '').toMatch(/<p class="plain-slot"[^>]*>(?:<!--[^>]*-->)*slotted text<\/p>/);
    });

    test('keeps slotted content when a scoped component removes and re-renders its slot', async ({
      page,
    }) => {
      const { html } = await renderToString(
        '<scoped-slot-toggle-cmp><span class="light">light content</span></scoped-slot-toggle-cmp>',
        { fullDocument: true },
      );
      await page.setContent(html || '');
      await waitForComponents(page, ['scoped-slot-toggle-cmp']);

      const light = page.locator('scoped-slot-toggle-cmp span.light');
      await expect(light).toHaveCount(1);
      await expect(page.locator('scoped-slot-toggle-cmp .wrap span.light')).toBeVisible();

      await page.evaluate(() => {
        (document.querySelector('scoped-slot-toggle-cmp') as any).showSlot = false;
      });
      await expect(light).toBeHidden();
      await expect(light).toHaveCount(1);

      await page.evaluate(() => {
        (document.querySelector('scoped-slot-toggle-cmp') as any).showSlot = true;
      });
      await expect(page.locator('scoped-slot-toggle-cmp .wrap span.light')).toBeVisible();
      await expect(light).toHaveCount(1);
      await expect(light).toHaveText('light content');
    });

    test('keeps slotted text in a scoped component nested in a shadow component inside a shadow root', async ({
      page,
    }) => {
      // shadow -> shadow -> scoped: the slotted text crosses two shadow boundaries
      const { html } = await renderToString(
        '<cmp-with-slot><shadow-text-parent-cmp text="deep"></shadow-text-parent-cmp></cmp-with-slot>',
        { fullDocument: true, serializeShadowRoot: 'declarative-shadow-dom' },
      );
      await page.setContent(html || '');
      await waitForComponents(page, ['cmp-with-slot', ...PARENT_TAGS]);
      expect(await slotted(page)).toEqual({
        scoped: 'deep',
        scopedChildren: 1,
        plain: 'deep',
        plainParagraphs: 1,
      });
    });
  });
});
