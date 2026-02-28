import { expect, Page } from '@playwright/test';
import { test } from '@stencil/playwright';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];

async function getElementOrder(page: Page, parent: string) {
  return await page.evaluate((parent: string) => {
    const el = document.querySelector(parent);
    if (!el) return { internal: [], external: [] };
    const external = Array.from(el.children).map((el) => el.tagName);
    const internal = Array.from((el as any).__children || []).map((el: Element) => el.tagName);
    return { internal, external };
  }, parent);
}

test.describe('`scoped: true` hydration checks', () => {
  test.beforeAll(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../../hydrate');
    renderToString = mod.renderToString;
  });

  test('does not add multiple style tags', async ({ page }) => {
    const { html } = await renderToString(
      `
        <non-shadow-child></non-shadow-child>
      `,
    );
    await page.setContent(html);

    const styles = page.locator('style');
    await expect(styles).toHaveCount(3);

    const style0Text = await styles.nth(0).textContent();
    const style1Text = await styles.nth(1).textContent();
    const style2Text = await styles.nth(2).textContent();

    expect(style1Text).toContain('.sc-non-shadow-child-h');
    expect(style0Text).not.toContain('.sc-non-shadow-child-h');
    expect(style2Text).not.toContain('.sc-non-shadow-child-h');
  });

  test('maintains order of multiple slots', async ({ page }) => {
    const { html } = await renderToString(
      `
        <non-shadow-multi-slots>
          <p>Default slot element</p>
          <p slot="second-slot">Second slot element</p>
        </non-shadow-multi-slots>
      `,
    );
    await page.setContent(html);

    const { internal } = await getElementOrder(page, 'non-shadow-multi-slots');
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
    expect(html).toContain('Slotted fallback content');
    await page.setContent(html);

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
    await page.setContent(html);

    const { external, internal } = await getElementOrder(page, 'non-shadow-wrapper');
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
    await page.setContent(html);

    const { external, internal } = await getElementOrder(page, 'non-shadow-forwarded-slot');
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
    await page.setContent(html);

    const textContent = await page.evaluate(
      () => document.querySelector('non-shadow-forwarded-slot')?.textContent?.trim() ?? '',
    );
    expect(textContent).toContain('Text node 1 Comment 1  Slotted element 1  Slotted element 2  Comment 2 Text node 2');
  });

  test('Steps through only "lightDOM" nodes', async ({ page }) => {
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
    await page.setContent(html);

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

  test('Steps through only "lightDOM" elements', async ({ page }) => {
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
    await page.setContent(html);

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
