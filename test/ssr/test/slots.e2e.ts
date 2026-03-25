import { expect, Page } from '@playwright/test';
import { test } from '@stencil/playwright';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../hydrate/index.mjs');
let renderToString: HydrateModule['renderToString'];
let resetHydrateDocData: HydrateModule['resetHydrateDocData'];

async function getNonShadowElementOrder(page: Page, parent: string) {
  return await page.evaluate((parent: string) => {
    const el = document.querySelector(parent);
    if (!el) return { internal: [], external: [] };
    const external = Array.from(el.children).map((el) => el.tagName);
    const internal = (Array.from((el as any).__children || []) as HTMLElement[]).map((el) => el.tagName);
    return { internal, external };
  }, parent);
}

test.describe('slot handling', () => {
  test.beforeEach(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../hydrate/index.mjs');
    renderToString = mod.renderToString;
    resetHydrateDocData = mod.resetHydrateDocData;
    resetHydrateDocData();
  });

  test.describe('scoped component slots', () => {
    test('maintains order of multiple slots', async ({ page }) => {
      const { html } = await renderToString(
        `
          <non-shadow-multi-slots>
            <p>Default slot element</p>
            <p slot="second-slot">Second slot element</p>
          </non-shadow-multi-slots>
        `,
      );
      await page.setContent(html || '');

      const { internal } = await getNonShadowElementOrder(page, 'non-shadow-multi-slots');
      expect(internal.length).toBe(7);
      expect(internal).toEqual(['DIV', 'P', 'DIV', 'DIV', 'SLOT-FB', 'P', 'DIV']);
    });

    test('shows fallback slot when no content is slotted', async ({ page }) => {
      const { html } = await renderToString(
        `
          <non-shadow-child></non-shadow-child>
          <non-shadow-child>test</non-shadow-child>
        `,
        {
          serializeShadowRoot: true,
        },
      );
      expect(html || '').toContain('Slotted fallback content');
      await page.setContent(html || '');

      const slots = page.locator('slot-fb');
      const slot0Hidden = await slots.nth(0).getAttribute('hidden');
      const slot1Hidden = await slots.nth(1).getAttribute('hidden');

      expect(slot0Hidden).toBeNull();
      expect(slot1Hidden).not.toBeNull();
    });

    test('keeps slotted elements in their assigned position and does not duplicate slotted children', async ({
      page,
    }) => {
      const { html } = await renderToString(
        `
        <non-shadow-wrapper>
          <non-shadow-child></non-shadow-child>
        </non-shadow-wrapper>
      `,
        {
          serializeShadowRoot: true,
        },
      );
      await page.setContent(html || '');

      const { external, internal } = await getNonShadowElementOrder(page, 'non-shadow-wrapper');
      expect(external.length).toBe(1);
      expect(internal.length).toBe(6);

      expect(internal).toEqual(['STRONG', 'P', 'SLOT-FB', 'NON-SHADOW-CHILD', 'P', 'STRONG']);
      expect(external).toEqual(['NON-SHADOW-CHILD']);

      const slots = page.locator('slot-fb');
      const slot0Hidden = await slots.nth(0).getAttribute('hidden');
      const slot1Hidden = await slots.nth(1).getAttribute('hidden');

      expect(slot0Hidden).not.toBeNull();
      expect(slot1Hidden).toBeNull();
    });

    test('forwards slotted nodes into a nested shadow component whilst keeping those nodes in the light dom', async ({
      page,
    }) => {
      const { html } = await renderToString(
        `
        <non-shadow-forwarded-slot>
          <p>slotted item 1</p>
          <p>slotted item 2</p>
          <p>slotted item 3</p>
        </non-shadow-forwarded-slot>
      `,
        {
          serializeShadowRoot: true,
        },
      );
      await page.setContent(html || '');

      const { external, internal } = await getNonShadowElementOrder(page, 'non-shadow-forwarded-slot');
      expect(external.length).toBe(3);
      expect(internal.length).toBe(5);

      expect(internal).toEqual(['STRONG', 'BR', 'SHADOW-CHILD', 'BR', 'STRONG']);
      expect(external).toEqual(['P', 'P', 'P']);
    });

    test('retains the correct order of different nodes', async ({ page }) => {
      const { html } = await renderToString(
        `
        <non-shadow-forwarded-slot>
          Text node 1
          <!--Comment 1 -->
          <p>Slotted element 1 </p>
          <p>Slotted element 2 </p>
          <!--Comment 2-->
          Text node 2
        </non-shadow-forwarded-slot>
      `,
        {
          serializeShadowRoot: true,
        },
      );
      await page.setContent(html || '');

      const textContent = await page.evaluate(
        () => document.querySelector('non-shadow-forwarded-slot')?.textContent?.trim() ?? '',
      );
      expect(textContent).toContain('Text node 1 Comment 1  Slotted element 1  Slotted element 2  Comment 2 Text node 2');
    });
  });

  test.describe('sibling accessors', () => {
    test('steps through only "lightDOM" nodes', async ({ page }) => {
      const { html } = await renderToString(
        `<hydrated-sibling-accessors>
           <p>First slot element</p>
           Default slot text node
           <p slot="second-slot">Second slot element</p>
           <!-- Default slot comment node  -->
        </hydrated-sibling-accessors>`,
        {
          serializeShadowRoot: true,
        },
      );
      await page.setContent(html || '');

      await page.evaluate(() => {
        (window as any).root = document.querySelector('hydrated-sibling-accessors');
      });

      expect(await page.evaluate(() => (window as any).root.firstChild.textContent)).toBe('First slot element');
      expect(await page.evaluate(() => (window as any).root.firstChild.nextSibling.textContent)).toBe(
        ' Default slot text node  ',
      );
      expect(await page.evaluate(() => (window as any).root.firstChild.nextSibling.nextSibling.textContent)).toBe(
        'Second slot element',
      );
      expect(
        await page.evaluate(
          () => (window as any).root.firstChild.nextSibling.nextSibling.nextSibling.nextSibling.textContent,
        ),
      ).toBe(' Default slot comment node  ');

      expect(await page.evaluate(() => (window as any).root.lastChild.previousSibling.textContent)).toBe(
        ' Default slot comment node  ',
      );
      expect(
        await page.evaluate(
          () => (window as any).root.lastChild.previousSibling.previousSibling.previousSibling.textContent,
        ),
      ).toBe('Second slot element');
      expect(
        await page.evaluate(
          () =>
            (window as any).root.lastChild.previousSibling.previousSibling.previousSibling.previousSibling.textContent,
        ),
      ).toBe(' Default slot text node  ');
      expect(
        await page.evaluate(
          () =>
            (window as any).root.lastChild.previousSibling.previousSibling.previousSibling.previousSibling.previousSibling
              .textContent,
        ),
      ).toBe('First slot element');
    });

    test('steps through only "lightDOM" elements', async ({ page }) => {
      const { html } = await renderToString(
        `<hydrated-sibling-accessors>
           <p>First slot element</p>
           Default slot text node
           <p slot="second-slot">Second slot element</p>
           <!-- Default slot comment node  -->
        </hydrated-sibling-accessors>`,
        {
          serializeShadowRoot: true,
        },
      );
      await page.setContent(html || '');

      await page.evaluate(() => {
        (window as any).root = document.querySelector('hydrated-sibling-accessors');
      });

      expect(await page.evaluate(() => (window as any).root.children[0].textContent)).toBe('First slot element');
      expect(await page.evaluate(() => (window as any).root.children[0].nextElementSibling.textContent)).toBe(
        'Second slot element',
      );
      expect(await page.evaluate(() => !(window as any).root.children[0].nextElementSibling.nextElementSibling)).toBe(
        true,
      );
      expect(
        await page.evaluate(
          () => (window as any).root.children[0].nextElementSibling.previousElementSibling.textContent,
        ),
      ).toBe('First slot element');
    });
  });

  test.describe('named slots in scoped components', () => {
    test('renders named slots in the correct order in the DOM in scoped components', async ({ page }) => {
      const { html } = await renderToString(
        `<div>
          <ssr-order-wrap-cmp>
            <div slot="things">one</div>
            <div slot="things">2</div>
            <div slot="things">3</div>
          </ssr-order-wrap-cmp>
        </div>`,
        {
          fullDocument: true,
          serializeShadowRoot: 'scoped',
        },
      );

      await page.setContent(html || '');
      await page.waitForSelector('ssr-order-wrap-cmp[custom-hydrate-flag]');

      const result = await page.evaluate(() => {
        const nestedCmp = document
          .querySelector('ssr-order-wrap-cmp')
          ?.shadowRoot?.querySelector('ssr-order-cmp') as Element;
        if (!nestedCmp) return { firstTag: null, secondText: null };
        return {
          firstTag: (nestedCmp.childNodes[0] as HTMLElement)?.tagName,
          secondText: nestedCmp.childNodes[1]?.textContent,
        };
      });

      expect(result.firstTag).toBe('SLOT');
      expect(result.secondText).toBe('after');
    });

    test('retains the order of slotted nodes in serializeShadowRoot scoped components', async ({ page }) => {
      const { html } = await renderToString(
        `<wrap-ssr-shadow-cmp>
          <ssr-shadow-cmp>
            <span>Should be first</span>
            <span slot="top">Should be second</span>
          </ssr-shadow-cmp>
        </wrap-ssr-shadow-cmp>`,
        {
          fullDocument: true,
          serializeShadowRoot: 'scoped',
          prettyHtml: false,
        },
      );

      await page.setContent(html || '');
      await page.waitForSelector('ssr-shadow-cmp[custom-hydrate-flag]');

      const childTexts = await page.evaluate(() => {
        const childComponent = document.querySelector('ssr-shadow-cmp');
        return Array.from(childComponent?.childNodes || [])
          .filter((n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent?.trim()))
          .map((n) => n.textContent?.trim());
      });

      expect(childTexts).toContain('Should be first');
      expect(childTexts).toContain('Should be second');
    });

    test('slots nodes appropriately in a scoped parent with serializeShadowRoot scoped child', async ({ page }) => {
      const { html } = await renderToString(
        `<scoped-ssr-parent-cmp>
          <div slot="things">one</div>
          <div slot="things">2</div>
          <div slot="things">3</div>
        </scoped-ssr-parent-cmp>`,
        {
          fullDocument: true,
          serializeShadowRoot: 'scoped',
        },
      );

      await page.setContent(html || '');
      await page.waitForSelector('scoped-ssr-parent-cmp[custom-hydrate-flag]');

      const result = await page.evaluate(() => {
        const wrapCmp = document.querySelector('scoped-ssr-parent-cmp');
        const children = Array.from(wrapCmp?.children || []);
        return {
          textContent: wrapCmp?.textContent?.replace(/\s+/g, '').trim(),
          visibleChildren: children.filter((c) => (c as HTMLElement).checkVisibility?.() ?? true).length,
        };
      });

      expect(result.textContent).toBe('one23');
      expect(result.visibleChildren).toBe(3);
    });

    test('scoped components forward slots into shadow components', async ({ page }) => {
      const { html } = await renderToString(
        `<div>
          <scoped-ssr-parent-cmp>
            <!-- 1 --> 2 <div>3</div> <!-- 4 -->
          </scoped-ssr-parent-cmp>
        </div>`,
        {
          fullDocument: true,
          serializeShadowRoot: 'scoped',
        },
      );

      await page.setContent(html || '');
      await page.waitForSelector('scoped-ssr-parent-cmp[custom-hydrate-flag]');

      const result = await page.evaluate(() => {
        const wrapCmp = document.querySelector('scoped-ssr-parent-cmp');
        const children = wrapCmp?.childNodes;
        const visibleDiv = wrapCmp?.querySelector('div');
        return {
          childCount: children?.length,
          hasVisibleDiv: visibleDiv ? (visibleDiv as HTMLElement).checkVisibility?.() ?? true : false,
          textContent: wrapCmp?.textContent?.replace(/\s+/g, ' ').trim(),
        };
      });

      expect(result.textContent).toContain('2');
      expect(result.textContent).toContain('3');
      expect(result.hasVisibleDiv).toBe(true);
    });
  });
});
