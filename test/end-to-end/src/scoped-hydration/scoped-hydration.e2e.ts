import { newE2EPage, E2EPage } from '@stencil/core/testing';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];

async function getElementOrder(page: E2EPage, parent: string) {
  return await page.evaluate((parent: string) => {
    const external = Array.from(document.querySelector(parent).children).map((el) => el.tagName);
    const internal = Array.from((document.querySelector(parent) as any).__children).map((el: Element) => el.tagName);
    return { internal, external };
  }, parent);
}

describe('`scoped: true` hydration checks', () => {
  beforeAll(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../../hydrate');
    renderToString = mod.renderToString;
  });

  it('does not add multiple style tags', async () => {
    const { html } = await renderToString(
      `
        <non-shadow-child></non-shadow-child> 
      `,
    );
    const page = await newE2EPage({ html, url: 'https://stencil.com' });
    const styles = await page.findAll('style');
    expect(styles.length).toBe(3);
    expect(styles[1].textContent).toContain(`.sc-non-shadow-child-h`);
    expect(styles[0].textContent).not.toContain(`.sc-non-shadow-child-h`);
    expect(styles[2].textContent).not.toContain(`.sc-non-shadow-child-h`);
  });

  it('maintains order of multiple slots', async () => {
    const { html } = await renderToString(
      `
        <non-shadow-multi-slots>
          <p>Default slot element</p>
          <p slot="second-slot">Second slot element</p>
        </non-shadow-multi-slots> 
      `,
    );
    const page = await newE2EPage({ html, url: 'https://stencil.com' });
    const { internal } = await getElementOrder(page, 'non-shadow-multi-slots');
    expect(internal.length).toBe(7);
    expect(internal).toEqual(['DIV', 'P', 'DIV', 'DIV', 'SLOT-FB', 'P', 'DIV']);
  });

  it('shows fallback slot when no content is slotted', async () => {
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
    const page = await newE2EPage({ html, url: 'https://stencil.com' });
    const slots = await page.findAll('slot-fb');
    expect(await slots[0].getAttribute('hidden')).toBeNull();
    expect(await slots[1].getAttribute('hidden')).not.toBeNull();
  });

  it('keeps slotted elements in their assigned position and does not duplicate slotted children', async () => {
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
    const page = await newE2EPage({ html, url: 'https://stencil.com' });

    const { external, internal } = await getElementOrder(page, 'non-shadow-wrapper');
    expect(external.length).toBe(1);
    expect(internal.length).toBe(6);

    expect(internal).toEqual(['STRONG', 'P', 'SLOT-FB', 'NON-SHADOW-CHILD', 'P', 'STRONG']);
    expect(external).toEqual(['NON-SHADOW-CHILD']);

    const slots = await page.findAll('slot-fb');
    expect(await slots[0].getAttribute('hidden')).not.toBeNull();
    expect(await slots[1].getAttribute('hidden')).toBeNull();
  });

  it('forwards slotted nodes into a nested shadow component whilst keeping those nodes in the light dom', async () => {
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
    const page = await newE2EPage({ html, url: 'https://stencil.com' });

    const { external, internal } = await getElementOrder(page, 'non-shadow-forwarded-slot');
    expect(external.length).toBe(3);
    expect(internal.length).toBe(5);

    expect(internal).toEqual(['STRONG', 'BR', 'SHADOW-CHILD', 'BR', 'STRONG']);
    expect(external).toEqual(['P', 'P', 'P']);
  });

  it('retains the correct order of different nodes', async () => {
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
    const page = await newE2EPage({ html, url: 'https://stencil.com' });

    expect(await page.evaluate(() => document.querySelector('non-shadow-forwarded-slot').textContent.trim())).toContain(
      'Text node 1 Comment 1 Slotted element 1 Slotted element 2 Comment 2 Text node 2',
    );
  });

  it('Steps through only "lightDOM" nodes', async () => {
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
    const page = await newE2EPage({ html, url: 'https://stencil.com' });

    let root: HTMLElement;
    await page.evaluate(() => {
      (window as any).root = document.querySelector('hydrated-sibling-accessors');
    });
    expect(await page.evaluate(() => root.firstChild.textContent)).toBe('First slot element');
    expect(await page.evaluate(() => root.firstChild.nextSibling.textContent)).toBe(' Default slot text node  ');
    expect(await page.evaluate(() => root.firstChild.nextSibling.nextSibling.textContent)).toBe('Second slot element');
    expect(await page.evaluate(() => root.firstChild.nextSibling.nextSibling.nextSibling.textContent)).toBe(
      ' Default slot comment node  ',
    );

    expect(await page.evaluate(() => root.lastChild.textContent)).toBe(' Default slot comment node  ');
    expect(await page.evaluate(() => root.lastChild.previousSibling.textContent)).toBe('Second slot element');
    expect(await page.evaluate(() => root.lastChild.previousSibling.previousSibling.textContent)).toBe(
      ' Default slot text node  ',
    );
    expect(await page.evaluate(() => root.lastChild.previousSibling.previousSibling.previousSibling.textContent)).toBe(
      'First slot element',
    );
  });

  it('Steps through only "lightDOM" elements', async () => {
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
    const page = await newE2EPage({ html, url: 'https://stencil.com' });

    let root: HTMLElement;
    await page.evaluate(() => {
      (window as any).root = document.querySelector('hydrated-sibling-accessors');
    });
    expect(await page.evaluate(() => root.children[0].textContent)).toBe('First slot element');
    expect(await page.evaluate(() => root.children[0].nextElementSibling.textContent)).toBe('Second slot element');
    expect(await page.evaluate(() => !root.children[0].nextElementSibling.nextElementSibling)).toBe(true);
    expect(await page.evaluate(() => root.children[0].nextElementSibling.previousElementSibling.textContent)).toBe(
      'First slot element',
    );
  });
});
